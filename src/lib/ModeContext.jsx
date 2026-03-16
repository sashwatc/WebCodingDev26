import React, { createContext, useContext, useState } from "react";

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  return (
    <ModeContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}