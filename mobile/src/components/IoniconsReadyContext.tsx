import { createContext, useContext, type ReactNode } from 'react';

const IoniconsReadyContext = createContext(false);

export function IoniconsReadyProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <IoniconsReadyContext.Provider value={ready}>
      {children}
    </IoniconsReadyContext.Provider>
  );
}

export function useIoniconsReady() {
  return useContext(IoniconsReadyContext);
}
