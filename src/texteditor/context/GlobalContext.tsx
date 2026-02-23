
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BlocChangesType {
  type: string;
  key: string;
  id: string;
}

export interface SearchResult {
  filePath: string;
  line: string;
  position: number
  node: any
}

interface GlobalContextType {
  modified: BlocChangesType;
  setModified: (state: BlocChangesType) => void;
  documentIsModified: () => boolean;
  title: string;
  setTitle: (title: string) => void;
  searchResult: SearchResult[];
  setSearchResult: (searchResult: SearchResult[]) => void;
  occurance: string;
  setOccurance: (occurance: string) => void;
  dirtyARMBlocs: BlocChangesType[];
  dirtyUpdateBlocs: BlocChangesType[];
  keyIdPositionList: Map<string, {id: string, position: string}>;
  setKeyIdPositionList: (keyIdPositionList: Map<string, {id: string, position: string}>) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const emptyChanges = { key: '', type: '', id: '', updateAt: 0};
  let dirtyARMBlocs: BlocChangesType[] = [];
  let dirtyUpdateBlocs: BlocChangesType[] = [];

  const [modified, setModified] = useState<BlocChangesType>(emptyChanges);
  const [title, setTitle] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
  const [occurance, setOccurance] = useState<string>('');
  const [keyIdPositionList, setKeyIdPositionList] = useState<Map<string, {id: string, position: string}>>(new Map());


  function documentIsModified(): boolean {
    let _isModified = false;
    if (modified.key.length === 0 && modified.type.length === 0) {
      _isModified = false;
    } else {
      _isModified = true;
    }
    return _isModified;
  }

  return (
    <GlobalContext.Provider
      value={{
        searchResult,
        setSearchResult,
        modified,
        documentIsModified,
        setModified,
        title,
        setTitle,
        occurance,
        setOccurance,
        dirtyARMBlocs,
        dirtyUpdateBlocs,
        keyIdPositionList,
        setKeyIdPositionList,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalContextProvider');
  }
  return context;
};

export default GlobalContext;
