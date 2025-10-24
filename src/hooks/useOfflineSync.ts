import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getSupabaseStatus } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface SyncData {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: Date;
  synced: boolean;
  tenantId: string;
}

export function useOfflineSync() {
  const { currentTenant } = useTenant();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<SyncData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);

  // Check Supabase availability on mount
  useEffect(() => {
    try {
      const status = getSupabaseStatus();
      setSupabaseAvailable(status.isConfigured && supabase !== null);
      
      if (!status.isConfigured) {
        console.log('ℹ️ Supabase not configured - Working in offline mode');
      } else if (!supabase) {
        console.log('ℹ️ Supabase client not available - Working in offline mode');
      } else {
        console.log('✅ Supabase available - Real-time sync enabled');
      }
    } catch (error) {
      console.warn('Supabase status check failed:', error);
      setSupabaseAvailable(false);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (supabaseAvailable && supabase) {
        syncPendingData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [supabaseAvailable]);

  // Load pending sync data from localStorage
  useEffect(() => {
    try {
      const savedPending = localStorage.getItem('brainbox_pending_sync');
      if (savedPending) {
        const pending = JSON.parse(savedPending);
        pending.forEach((item: any) => {
          item.timestamp = new Date(item.timestamp);
        });
        setPendingSync(pending);
      }

      const savedLastSync = localStorage.getItem('brainbox_last_sync');
      if (savedLastSync) {
        setLastSyncTime(new Date(savedLastSync));
      }
    } catch (error) {
      console.warn('⚠️ Failed to load sync data:', error);
      setPendingSync([]);
    }
  }, []);

  // Save pending sync data to localStorage
  const savePendingSync = useCallback((data: SyncData[]) => {
    try {
      localStorage.setItem('brainbox_pending_sync', JSON.stringify(data));
      setPendingSync(data);
    } catch (error) {
      console.warn('⚠️ Failed to save sync data:', error);
    }
  }, []);

  // Add data to sync queue
  const queueForSync = useCallback((action: 'create' | 'update' | 'delete', table: string, data: any) => {
    if (!currentTenant || !supabaseAvailable || !supabase) return;

    try {
      const syncItem: SyncData = {
        id: crypto.randomUUID(),
        action,
        table,
        data,
        timestamp: new Date(),
        synced: false,
        tenantId: currentTenant.id
      };

      const newPending = [...pendingSync, syncItem];
      savePendingSync(newPending);

      // Try to sync immediately if online
      if (isOnline && supabaseAvailable && supabase) {
        syncPendingData();
      }
    } catch (error) {
      console.warn('⚠️ Failed to queue sync data:', error);
    }
  }, [pendingSync, isOnline, savePendingSync, currentTenant, supabaseAvailable]);

  // Sync pending data to Supabase
  const syncPendingData = useCallback(async () => {
    if (!isOnline || !supabaseAvailable || !supabase || pendingSync.length === 0) {
      if (pendingSync.length > 0) {
        console.log(`ℹ️ ${pendingSync.length} items queued for sync when connection is available`);
      }
      return;
    }

    try {
      const unsynced = pendingSync.filter(item => !item.synced);
      
      if (unsynced.length === 0) {
        return;
      }
      
      console.log(`🔄 Syncing ${unsynced.length} items to Supabase...`);
      
      // Add timeout for each sync operation
      for (const item of unsynced) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          await syncSingleItem(item, controller.signal);
          clearTimeout(timeoutId);
          item.synced = true;
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn(`⏱️ Sync timeout: ${item.action} ${item.table}`);
          } else {
            console.warn(`❌ Sync failed: ${item.action} ${item.table}`, error.message);
          }
          // Don't mark as synced if it failed
        }
      }

      // Remove synced items
      const stillPending = pendingSync.filter(item => !item.synced);
      savePendingSync(stillPending);
      
      setLastSyncTime(new Date());
      localStorage.setItem('brainbox_last_sync', new Date().toISOString());

    } catch (error) {
      console.warn('❌ Batch sync failed:', error);
      // Continue operation even if sync fails
    }
  }, [isOnline, supabaseAvailable, pendingSync, savePendingSync]);

  // Sync data from Supabase to local storage
  const syncFromServer = useCallback(async () => {
    if (!isOnline || !supabaseAvailable || !supabase) {
      console.log('ℹ️ Sync from server skipped - offline or Supabase not available');
      return;
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Test connection first
      const { data: heartbeat } = await supabase
        .from('heartbeat')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      console.log('✅ Supabase connection verified');
      setLastSyncTime(new Date());
      localStorage.setItem('brainbox_last_sync', new Date().toISOString());
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Sync from Supabase timed out - connection may be slow');
      } else {
        console.warn('⚠️ Sync from Supabase failed:', error);
      }
      // Don't throw error to prevent breaking the app
    }
  }, [isOnline, supabaseAvailable]);

  // Validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Sync single item to Supabase
  const syncSingleItem = async (item: SyncData, signal?: AbortSignal) => {
    if (!supabaseAvailable || !supabase) {
      throw new Error('Supabase not available');
    }
    
    const { action, table, data } = item;

    // Skip items with invalid UUID format
    if (data.id && !isValidUUID(data.id)) {
      console.warn(`Skipping sync for item with invalid UUID: ${data.id}`);
      return;
    }

    try {
      switch (action) {
        case 'create':
          const { error: createError } = await supabase
            .from(table)
            .insert(data)
            .abortSignal(signal);
          if (createError) {
            throw new Error(`Failed to sync ${action} to ${table}: ${createError.message}`);
          }
          break;

        case 'update':
          const { error: updateError } = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id)
            .abortSignal(signal);
          if (updateError) {
            throw new Error(`Failed to sync ${action} to ${table}: ${updateError.message}`);
          }
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id)
            .abortSignal(signal);
          if (deleteError) {
            throw new Error(`Failed to sync ${action} to ${table}: ${deleteError.message}`);
          }
          break;
      }
    } catch (error) {
      throw error; // Re-throw to be handled by caller
    }
  };

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (isOnline && supabaseAvailable && supabase) {
      const interval = setInterval(() => {
        syncPendingData();
        syncFromServer();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOnline, supabaseAvailable, syncPendingData, syncFromServer]);

  return {
    isOnline: isOnline,
    supabaseConnected: isOnline && supabaseAvailable && !!supabase,
    pendingSync: pendingSync.length,
    lastSyncTime,
    queueForSync,
    syncNow: syncPendingData,
    syncFromServer,
    connectionStatus: {
      network: isOnline,
      database: supabaseAvailable && !!supabase,
      realTimeSync: isOnline && supabaseAvailable && !!supabase
    }
  };
}