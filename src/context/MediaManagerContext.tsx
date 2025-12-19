import React, { createContext, ReactNode } from 'react';
import { useMediaManager } from '../hooks/useMediaManager';

type MediaManagerContextType = ReturnType<typeof useMediaManager>;

export const MediaManagerContext = createContext<MediaManagerContextType>({} as MediaManagerContextType);

export const MediaManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mediaManager = useMediaManager();

  return (
    <MediaManagerContext.Provider value={mediaManager}>
      {children}
    </MediaManagerContext.Provider>
  );
};