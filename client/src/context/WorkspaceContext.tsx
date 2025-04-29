import React, { createContext, useState, useContext, ReactNode } from "react";

// Define the shape of your context data
interface WorkspaceContextType {
  workspaceId: string | null;
  scriptId: string | null;
  setWorkspaceId: (id: string | null) => void;
  setScriptId: (id: string | null) => void;
}

// Create the context with default values
const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: null,
  scriptId: null,
  setWorkspaceId: () => {},
  setScriptId: () => {},
});

// Provider component
interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const [workspaceId, setWorkspaceId] = useState<string | null>("67ef5c1032c9368838561563"); // Default workspace ID
  const [scriptId, setScriptId] = useState<string | null>(null);

  return (
    <WorkspaceContext.Provider 
      value={{ 
        workspaceId, 
        scriptId, 
        setWorkspaceId, 
        setScriptId 
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

// Custom hook for using this context
export const useWorkspace = () => useContext(WorkspaceContext);