import React, { createContext, useContext, useState, useCallback } from 'react';

const GlobalInvestigationContext = createContext(null);

export function GlobalInvestigationContextProvider({ children }) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [spatialPayload, setSpatialPayload] = useState(null);

  const openInvestigation = useCallback((payload) => {
    setSpatialPayload(payload || null);
    setIsOverlayOpen(true);
    setIsMinimized(false);
  }, []);

  const closeInvestigation = useCallback(() => {
    setIsOverlayOpen(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const clearSpatialPayload = useCallback(() => {
    setSpatialPayload(null);
  }, []);

  return (
    <GlobalInvestigationContext.Provider
      value={{
        isOverlayOpen,
        isMinimized,
        spatialPayload,
        openInvestigation,
        closeInvestigation,
        toggleMinimize,
        clearSpatialPayload
      }}
    >
      {children}
    </GlobalInvestigationContext.Provider>
  );
}

export function useGlobalInvestigation() {
  const context = useContext(GlobalInvestigationContext);
  if (!context) {
    return {
      isOverlayOpen: false,
      isMinimized: false,
      spatialPayload: null,
      openInvestigation: () => {},
      closeInvestigation: () => {},
      toggleMinimize: () => {},
      clearSpatialPayload: () => {}
    };
  }
  return context;
}
