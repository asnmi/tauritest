import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { PageJson } from '../database/usePageDatabase'

interface NavigationContextType {
  itemPage: PageJson[],
  setItemPage: (itemPage: PageJson[]) => void,
  updateItemPage: (item:PageJson) => void;
  history: PageJson[];
  currentIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  updateItemHistory: (item: PageJson) => void;
  goBack: () => void;
  goForward: () => void;
  goToIndex: (index: number) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  updateCurrentItem: (updates: Partial<PageJson>) => void;
  getCurrentItemFromHistory: () => PageJson;
  searchHistory: (query: string) => PageJson[];
  emptyStorageHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const HISTORY_STORAGE_KEY = 'lexical-navigation-history';
const ITEMPAGE_STORAGE_KEY = 'lexical-navigation-item-page';
const MAX_HISTORY_SIZE = 100;

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<PageJson[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [itemPage, setItemPage] = useState<PageJson[]>([]);

  useEffect(()=>{
    loadHistoryFromLocalStorage();
    loadItemPageFromLocalStorage();
  },[]);

  // Sauvegarder l'historique dans le localStorage à chaque changement
  useEffect(() => {
    if (history.length > 0) {
      saveHistoryToLocalStorage();
    }
  }, [history, currentIndex]);

  useEffect(()=>{
    if (itemPage.length > 0) {
      saveItemPageToLocalStorage();
    }
  },[itemPage]);

    const updateItemPage = useCallback((item: Omit<PageJson, 'updated_at'>) => {
    const newItem: PageJson = {
      ...item,
      updated_at: Date.now(),
    };

    setItemPage(prev => {
      // Vérifier si le fichier existe déjà
      const existingIndex = prev.findIndex(h => h.path === item.path);
      
      if (existingIndex !== -1) {
        // Mettre à jour l'élément existant
        const updatedItemPage = [...prev];
        updatedItemPage[existingIndex] = {
          ...updatedItemPage[existingIndex],
          ...newItem,
          updated_at: Date.now(),
        };
        
        // Déplacer l'élément à la fin
        const [movedItem] = updatedItemPage.splice(existingIndex, 1);
        updatedItemPage.push(movedItem);
        
        return updatedItemPage;
      }
      const updatedItemPage = [...prev, newItem];
      return updatedItemPage;
    });
  }, []);

  
  const updateItemHistory = useCallback((item: Omit<PageJson, 'updated_at'>) => {
    const newItem: PageJson = {
      ...item,
      updated_at: Date.now(),
    };

    setHistory(prev => {
      // Vérifier si un élément avec le même ID existe déjà
      const existingIndex = prev.findIndex(h => h.id === item.id);
      
      const updatedHistory = [...prev];
      
      if (existingIndex !== -1) {
        // Supprimer l'élément existant pour le mettre à jour
        const [existingItem] = updatedHistory.splice(existingIndex, 1);
        
        // Mettre à jour l'élément existant avec les nouvelles propriétés
        const updatedItem = {
          ...existingItem,
          ...newItem,
          // Conserver certaines propriétés de l'ancien élément si nécessaire
          title: item.title || existingItem.title,
          updated_at: Date.now()
        };
        
        // Ajouter l'élément mis à jour à la fin de l'historique
        updatedHistory.push(updatedItem);
        
        setCurrentIndex(updatedHistory.length - 1);
        return updatedHistory;
      }

      // Supprimer les éléments après l'index actuel si on navigue depuis le milieu de l'historique
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Ajouter le nouvel élément
      newHistory.push(newItem);
      
      // Limiter l'historique à MAX_HISTORY_SIZE éléments
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        setCurrentIndex(newHistory.length - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, history.length]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
    }
  }, [history.length]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

    const emptyStorageHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    localStorage.clear();
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      const newIndex = Math.min(currentIndex, newHistory.length - 1);
      setCurrentIndex(newIndex);
      return newHistory;
    });
  }, [currentIndex]);

  const updateCurrentItem = useCallback((updates: Partial<PageJson>) => {
    setHistory(prev => {
      if (currentIndex >= 0 && currentIndex < prev.length) {
        const newHistory = [...prev];
        newHistory[currentIndex] = {
          ...newHistory[currentIndex],
          ...updates,
          updated_at: Date.now(),
        };
        return newHistory;
      }
      return prev;
    });
  }, [currentIndex]);

  const newItem = {
                id: '',
                position: '',
                content: '',
                page_id: '',
                bloc_type: '',
                created_at: 0,
                updated_at: 0
              };

  const getCurrentItemFromHistory = useCallback(() => {
    return history[currentIndex] || newItem;
  }, [history, currentIndex]);

  const searchHistory = useCallback((query: string): PageJson[] => {
    const lowercaseQuery = query.toLowerCase();
    return history.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.path?.toLowerCase().includes(lowercaseQuery)
    );
  }, [history]);

  const saveHistoryToLocalStorage = useCallback(() => {
    try {
      const historyData = {
        history: history.slice(-50), // Garder seulement les 50 derniers éléments
        currentIndex: Math.min(currentIndex, 49),
        savedAt: Date.now(),
      };
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [history, currentIndex]);

    const saveItemPageToLocalStorage = useCallback(() => {
    try {
      const itemPageData = {
        itemPage: itemPage
      }
      localStorage.setItem(ITEMPAGE_STORAGE_KEY, JSON.stringify(itemPageData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [itemPage]);

  const loadHistoryFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.history && Array.isArray(data.history)) {
          setHistory(data.history);
          setCurrentIndex(data.currentIndex || 0);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  }, []);

    const loadItemPageFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(ITEMPAGE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.itemPage && Array.isArray(data.itemPage)) {
          setItemPage(data.itemPage);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  }, []);

  const handleGoToIndex = useCallback((index: number) => {
    // 1. Sauvegarder l’historique courant dans la page courante
    // 2. Changer de page
    goToIndex(index);
    // 3. Restaurer l’historique de la nouvelle page
    // 4. Charger l’état de l’éditeur
    const item = history[index];
    if (item) {
      // Assuming loadEditorState is defined elsewhere or will be added
      // loadEditorState(item.editorState); 
    }
  }, [history, currentIndex, goToIndex]); // Added goToIndex to dependency array

  const value: NavigationContextType = {
    itemPage,
    setItemPage,
    updateItemPage,
    history,
    currentIndex,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
    goBack,
    goForward,
    goToIndex: handleGoToIndex,
    clearHistory,
    removeFromHistory,
    updateCurrentItem,
    updateItemHistory,
    getCurrentItemFromHistory,
    searchHistory,
    emptyStorageHistory
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
