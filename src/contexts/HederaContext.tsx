import React, { createContext, useContext, ReactNode } from 'react';
import useHederaState from '../hooks/useHedera';

// Create the context
const HederaContext = createContext<ReturnType<typeof useHederaState> | undefined>(undefined);

// Provider component
export const HederaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const hederaState = useHederaState();
  
  return (
    <HederaContext.Provider value={hederaState}>
      {children}
    </HederaContext.Provider>
  );
};

// Hook to use the Hedera context
export const useHedera = () => {
  const context = useContext(HederaContext);
  if (context === undefined) {
    throw new Error('useHedera must be used within a HederaProvider');
  }
  return context;
};

export default HederaContext; 