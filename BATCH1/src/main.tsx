import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase, initializeSupabaseAuth } from './lib/supabase';

// Initialize Supabase Auth only if configured
try {
  if (supabase) {
    initializeSupabaseAuth().catch(error => {
      console.warn('Supabase Auth initialization failed:', error);
    });
  } else {
    console.log('ℹ️ Supabase not available - App running in offline mode');
  }
} catch (error) {
  console.warn('Main initialization error:', error);
}

// Ensure app renders even if initialization fails
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    console.error('Root element not found');
  }
} catch (error) {
  console.error('App rendering failed:', error);
  
  // Fallback: Create a simple error display
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px;">
          <h1 style="color: #1f2937; margin-bottom: 1rem;">BrainBox-RetailPlus V25</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">Loading application...</p>
          <p style="color: #ef4444; font-size: 0.875rem;">If this message persists, please refresh the page.</p>
        </div>
      </div>
    `;
  }
}
