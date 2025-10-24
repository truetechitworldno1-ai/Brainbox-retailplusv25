import React, { createContext, useContext, useState, useEffect } from 'react';

interface CustomMessages {
  greeting: string;
  thankYou: string;
  goodbye: string;
  welcome: string;
  assistance: string;
  promotion: string;
  bestSeller: string;
  worstSeller: string;
  expiryAlert: string;
  automaticSale: string;
  esteemedCustomer: string;
  patronageThankYou: string;
  rewardEarned: string;
  subscriptionWarning: string;
  subscriptionExpired: string;
}

interface AudioContextType {
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  customMessages: CustomMessages;
  updateCustomMessage: (key: keyof CustomMessages, message: string) => void;
  playCustomerGreeting: () => void;
  playCustomerThankYou: () => void;
  playGoodbyeMessage: () => void;
  playWelcomeMessage: () => void;
  playAssistanceMessage: () => void;
  playPromotionMessage: () => void;
  playBestSellerAlert: () => void;
  playWorstSellerAlert: () => void;
  playExpiryAlert: () => void;
  playAutomaticSaleMessage: () => void;
  playEsteemedCustomerMessage: () => void;
  playPatronageThankYou: () => void;
  playRewardMessage: (points: number, percentage: number, amount: number) => void;
  playSubscriptionAlert: (daysRemaining: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const defaultMessages: CustomMessages = {
  greeting: "Welcome! How may we help?",
  thankYou: "Thank you! Please come again.",
  goodbye: "Thank you! Have a great day!",
  welcome: "Welcome to BRAINBOX RETAILPLUS!",
  assistance: "Need help? We're here to assist.",
  promotion: "Check our special offers!",
  bestSeller: "Alert: We have identified our best-selling product for this period.",
  worstSeller: "Alert: Some products need attention due to low sales performance.",
  expiryAlert: "Attention inventory officers: Products are approaching expiry dates.",
  automaticSale: "Sale complete!",
  esteemedCustomer: "Thank you for choosing us!",
  patronageThankYou: "Thanks for your patronage!",
  rewardEarned: "You earned {points} points!",
  subscriptionWarning: "Attention: Your subscription expires in {days} days. Please renew to continue using all features.",
  subscriptionExpired: "Your subscription has expired. Some features may be limited until renewal."
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [customMessages, setCustomMessages] = useState<CustomMessages>(defaultMessages);
  const [lastF5Press, setLastF5Press] = useState(0);

  const speak = (text: string) => {
    if (!isAudioEnabled || import.meta.env.DEV) return;
    
    try {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.4; // Faster speech for busy cashiers
        utterance.pitch = 1;
        utterance.volume = 0.6; // Lower volume for less distraction
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
    }
  };

  const speakSafe = (text: string) => {
    if (!isAudioEnabled) return;
    
    try {
      if ('speechSynthesis' in window && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.4; // Faster speech for busy cashiers
      utterance.pitch = 1;
      utterance.volume = 0.6; // Lower volume for less distraction
      speechSynthesis.speak(utterance);
      }
    } catch (error) {
      // Silently fail in development/preview environments
      if (import.meta.env.DEV) {
        console.log('Audio disabled in development mode');
      } else {
        console.warn('Speech synthesis error:', error);
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const updateCustomMessage = (key: keyof CustomMessages, message: string) => {
    setCustomMessages(prev => ({
      ...prev,
      [key]: message
    }));
    // Save to localStorage immediately
    const updatedMessages = { ...customMessages, [key]: message };
    localStorage.setItem('brainbox_audio_messages', JSON.stringify(updatedMessages));
  };

  useEffect(() => {
    const saveAudioSettings = () => {
      localStorage.setItem('brainbox_audio_enabled', JSON.stringify(isAudioEnabled));
    };
    saveAudioSettings();
  }, [isAudioEnabled]);

  useEffect(() => {
    localStorage.setItem('brainbox_audio_messages', JSON.stringify(customMessages));
  }, [customMessages]);

  const playCustomerGreeting = () => speak(customMessages.greeting);
  const playCustomerThankYou = () => speak(customMessages.thankYou);
  const playGoodbyeMessage = () => speak(customMessages.goodbye);
  const playWelcomeMessage = () => speak(customMessages.welcome);
  const playAssistanceMessage = () => speak(customMessages.assistance);
  const playPromotionMessage = () => speak(customMessages.promotion);
  const playBestSellerAlert = () => speak("Best seller!");
  const playWorstSellerAlert = () => speak("Low sales!");
  const playExpiryAlert = () => speak("Expiry alert!");
  const playAutomaticSaleMessage = () => speak(customMessages.automaticSale);
  const playEsteemedCustomerMessage = () => speak(customMessages.esteemedCustomer);
  const playPatronageThankYou = () => speak(customMessages.patronageThankYou);
  
  const playRewardMessage = (points: number, percentage: number, amount: number) => {
    speak(customMessages.rewardEarned.replace('{points}', points.toString()));
  };

  const playSubscriptionAlert = (daysRemaining: number) => {
    speak(daysRemaining > 0 ? `${daysRemaining} days left` : "Expired");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const savedAudioEnabled = localStorage.getItem('brainbox_audio_enabled');
    if (savedAudioEnabled) {
      setIsAudioEnabled(JSON.parse(savedAudioEnabled));
    }

    const savedMessages = localStorage.getItem('brainbox_audio_messages');
    if (savedMessages) {
      setCustomMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent F12 from opening dev tools when Poppy is active
      if (event.key === 'F12') {
        // Let Poppy handle F12, don't interfere
        return;
      }
      
      // F5 - Customer greeting or thank you (double press)
      if (event.key === 'F5') {
        event.preventDefault();
        const now = Date.now();
        if (now - lastF5Press < 300) {
          // Double press - play thank you
          playCustomerThankYou();
          console.log('🎵 Audio: Thank you message played (F5 double press)');
        } else {
          // Single press - play greeting
          playCustomerGreeting();
          console.log('🎵 Audio: Customer greeting played (F5)');
        }
        setLastF5Press(now);
      }
      
      // F6 - Goodbye message
      if (event.key === 'F6') {
        event.preventDefault();
        playGoodbyeMessage();
        console.log('🎵 Audio: Goodbye message played (F6)');
      }
      
      // F7 - Welcome message
      if (event.key === 'F7') {
        event.preventDefault();
        playWelcomeMessage();
        console.log('🎵 Audio: Welcome message played (F7)');
      }
      
      // F8 - Assistance message
      if (event.key === 'F8') {
        event.preventDefault();
        playAssistanceMessage();
        console.log('🎵 Audio: Assistance message played (F8)');
      }
      
      // F9 - Promotion message
      if (event.key === 'F9') {
        event.preventDefault();
        playPromotionMessage();
        console.log('🎵 Audio: Promotion message played (F9)');
      }
      
      // Ctrl+Shift+B - Best seller alert
      if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        playBestSellerAlert();
        console.log('🎵 Audio: Best seller alert played (Ctrl+Shift+B)');
      }
      
      // Ctrl+Shift+W - Worst seller alert
      if (event.ctrlKey && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        playWorstSellerAlert();
        console.log('🎵 Audio: Worst seller alert played (Ctrl+Shift+W)');
      }
      
      // Ctrl+Shift+E - Expiry alert
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        playExpiryAlert();
        console.log('🎵 Audio: Expiry alert played (Ctrl+Shift+E)');
      }
    };

    // Use capture phase to ensure audio shortcuts work properly
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [lastF5Press, customMessages, isAudioEnabled]);

  const value: AudioContextType = {
    isAudioEnabled,
    toggleAudio,
    customMessages,
    updateCustomMessage,
    playCustomerGreeting,
    playCustomerThankYou,
    playGoodbyeMessage,
    playWelcomeMessage,
    playAssistanceMessage,
    playPromotionMessage,
    playBestSellerAlert,
    playWorstSellerAlert,
    playExpiryAlert,
    playAutomaticSaleMessage,
    playEsteemedCustomerMessage,
    playPatronageThankYou,
    playRewardMessage,
    playSubscriptionAlert,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}