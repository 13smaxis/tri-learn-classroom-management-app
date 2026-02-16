
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  forceRefreshKey: string;
  forceGlobalRefresh: () => void;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  forceRefreshKey: '',
  forceGlobalRefresh: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [forceRefreshKey, setForceRefreshKey] = useState(() => Date.now().toString());

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Call this to trigger a global re-fetch in all listening components
  const forceGlobalRefresh = useCallback(() => {
    setForceRefreshKey(Date.now().toString());
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        forceRefreshKey,
        forceGlobalRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
