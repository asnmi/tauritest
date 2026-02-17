import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MathVariablesContextType {
  variables: Record<string, number>;
  setVariable: (name: string, value: number) => void;
  getVariable: (name: string) => number | undefined;
  getAllVariables: () => Record<string, number>;
  removeVariable: (name: string) => void;
}

const MathVariablesContext = createContext<MathVariablesContextType | undefined>(undefined);

export const MathVariablesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [variables, setVariables] = useState<Record<string, number>>({});

  const setVariable = useCallback((name: string, value: number) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const getVariable = useCallback((name: string) => {
    return variables[name];
  }, [variables]);

  const getAllVariables = useCallback(() => {
    return { ...variables };
  }, [variables]);

  const removeVariable = useCallback((name: string) => {
    setVariables(prev => {
      const newVars = { ...prev };
      delete newVars[name];
      return newVars;
    });
  }, []);

  return (
    <MathVariablesContext.Provider 
      value={{
        variables,
        setVariable,
        getVariable,
        getAllVariables,
        removeVariable
      }}
    >
      {children}
    </MathVariablesContext.Provider>
  );
};

export const useMathVariables = (): MathVariablesContextType => {
  const context = useContext(MathVariablesContext);
  if (context === undefined) {
    throw new Error('useMathVariables must be used within a MathVariablesProvider');
  }
  return context;
};

export default MathVariablesContext;
