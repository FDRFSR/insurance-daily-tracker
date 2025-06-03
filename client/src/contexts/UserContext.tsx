// client/src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
    language: 'it' | 'en';
    notifications: boolean;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
}

const defaultUser: User = {
  id: 1,
  name: "Marco Rossi",
  email: "marco.rossi@insuratask.it",
  role: "Agente Assicurativo",
  company: "InsuraTask",
  preferences: {
    theme: 'light',
    language: 'it',
    notifications: true
  }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook personalizzato per usare il context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Utility functions per localStorage
const USER_STORAGE_KEY = 'insuratask_user';
const PREFERENCES_STORAGE_KEY = 'insuratask_preferences';

function saveUserToStorage(user: User): void {
  try {
    // Salva user info (senza password/token sensibili)
    const userToSave = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      avatar: user.avatar
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
    
    // Salva preferenze separatamente
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(user.preferences));
    
    console.log('✅ Utente salvato in localStorage:', userToSave.name);
  } catch (error) {
    console.error('❌ Errore nel salvare utente:', error);
  }
}

function loadUserFromStorage(): User | null {
  try {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    const savedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      let preferences = defaultUser.preferences;
      
      if (savedPreferences) {
        try {
          const parsedPreferences = JSON.parse(savedPreferences);
          // Valida che le preferenze abbiano la struttura corretta
          preferences = {
            theme: parsedPreferences.theme === 'dark' ? 'dark' : 'light',
            language: parsedPreferences.language === 'en' ? 'en' : 'it',
            notifications: Boolean(parsedPreferences.notifications)
          };
        } catch (prefError) {
          console.warn('⚠️ Preferenze corrotte, uso quelle di default');
        }
      }
      
      const user: User = {
        id: userData.id || defaultUser.id,
        name: userData.name || defaultUser.name,
        email: userData.email || defaultUser.email,
        role: userData.role || defaultUser.role,
        company: userData.company || defaultUser.company,
        avatar: userData.avatar,
        preferences
      };
      
      console.log('✅ Utente caricato da localStorage:', user.name);
      return user;
    }
  } catch (error) {
    console.error('❌ Errore nel caricare utente:', error);
  }
  return null;
}

function clearUserFromStorage(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    console.log('✅ Dati utente cancellati da localStorage');
  } catch (error) {
    console.error('❌ Errore nel cancellare dati utente:', error);
  }
}

// Provider Component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carica utente da localStorage all'avvio
  useEffect(() => {
    console.log('🔄 Caricamento utente...');
    
    const savedUser = loadUserFromStorage();
    
    if (savedUser) {
      setUser(savedUser);
    } else {
      // Se non c'è utente salvato, usa quello di default
      console.log('📝 Nessun utente salvato, uso default:', defaultUser.name);
      setUser(defaultUser);
      saveUserToStorage(defaultUser);
    }
    
    setIsLoading(false);
  }, []);

  // Salva automaticamente quando user cambia (ma non durante il logout)
  useEffect(() => {
    if (user && !isLoading) {
      saveUserToStorage(user);
    }
    // Non salvare quando user è null (logout)
  }, [user, isLoading]);

  const updateUser = (updates: Partial<User>): void => {
    setUser(currentUser => {
      if (!currentUser) {
        console.warn('⚠️ Tentativo di aggiornare utente quando è null');
        return null;
      }
      
      // Se stiamo aggiornando le preferenze, le mergiamo correttamente
      if (updates.preferences) {
        const updatedUser: User = {
          ...currentUser,
          ...updates,
          preferences: { 
            ...currentUser.preferences, 
            ...updates.preferences 
          }
        };
        console.log('🔄 Utente aggiornato:', updatedUser.name);
        return updatedUser;
      }
      
      // Altrimenti aggiorna normalmente
      const updatedUser: User = { ...currentUser, ...updates };
      console.log('🔄 Utente aggiornato:', updatedUser.name);
      return updatedUser;
    });
  };

  const logout = (): void => {
    console.log('👋 Logout utente');
    setUser(null);
    clearUserFromStorage();
  };

  const value: UserContextType = {
    user,
    setUser,
    updateUser,
    logout,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook per le preferenze specifiche
export function useUserPreferences() {
  const { user, updateUser } = useUser();
  
  const updatePreferences = (newPreferences: Partial<User['preferences']>): void => {
    if (!user) {
      console.warn('⚠️ Tentativo di aggiornare preferenze quando utente è null');
      return;
    }
    
    updateUser({ 
      preferences: { 
        ...user.preferences, 
        ...newPreferences 
      } 
    });
  };

  // Valori di fallback sicuri
  const defaultPrefs: User['preferences'] = {
    theme: 'light',
    language: 'it',
    notifications: true
  };

  return {
    preferences: user?.preferences || defaultPrefs,
    updatePreferences,
    theme: user?.preferences?.theme || defaultPrefs.theme,
    language: user?.preferences?.language || defaultPrefs.language,
    notifications: user?.preferences?.notifications ?? defaultPrefs.notifications
  };
}

// Hook per azioni utente comuni
export function useUserActions() {
  const { user, updateUser, logout } = useUser();
  
  const changeTheme = (theme: 'light' | 'dark'): void => {
    if (!user) {
      console.warn('⚠️ Tentativo di cambiare tema quando utente è null');
      return;
    }
    
    updateUser({ 
      preferences: { 
        ...user.preferences, 
        theme 
      } 
    });
  };
  
  const changeLanguage = (language: 'it' | 'en'): void => {
    if (!user) {
      console.warn('⚠️ Tentativo di cambiare lingua quando utente è null');
      return;
    }
    
    updateUser({ 
      preferences: { 
        ...user.preferences, 
        language 
      } 
    });
  };
  
  const toggleNotifications = (): void => {
    if (!user) {
      console.warn('⚠️ Tentativo di cambiare notifiche quando utente è null');
      return;
    }
    
    updateUser({ 
      preferences: { 
        ...user.preferences,
        notifications: !user.preferences.notifications 
      } 
    });
  };

  return {
    changeTheme,
    changeLanguage,
    toggleNotifications,
    logout
  };
}