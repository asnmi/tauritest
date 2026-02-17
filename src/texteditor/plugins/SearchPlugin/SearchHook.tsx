// Nouveau fichier: src/texteditor/plugins/SearchPlugin/useSearch.ts
import { useState, useCallback } from 'react';

interface SearchResult {
  range: Range;
  highlight: Highlight;
}

interface SearchState {
  text: string;
  results: SearchResult[];
  currentIndex: number;
  isActive: boolean;
}

const useSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    text: '',
    results: [],
    currentIndex: -1,
    isActive: false
  });

  // Fonction utilitaire pour mettre à jour l'état de manière sûre
  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setSearchState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Fonction pour effacer les surlignages
  const clearHighlights = useCallback(() => {
    window.CSS.highlights?.delete('search-highlight');
    updateSearchState({
      results: [],
      currentIndex: -1,
      isActive: false
    });
  }, [updateSearchState]);

  // Fonction pure pour trouver les correspondances
  const findMatches = 
  (text: string, element: HTMLElement): SearchResult[] => {
    if (!text.trim()) return [];
    
    const highlight = new Highlight();
    const results: SearchResult[] = [];

    const addMatchesInElement = (el: HTMLElement) => {
      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.textContent) return NodeFilter.FILTER_REJECT;
            return node.textContent.includes(text) 
              ? NodeFilter.FILTER_ACCEPT 
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      let node: Text | null;
      while (node = walker.nextNode() as Text | null) {
        const nodeText = node.textContent || '';
        let startPos = 0;
        let index: number;
        
        while ((index = nodeText.indexOf(text, startPos)) > -1) {
          const range = new Range();
          range.setStart(node, index);
          range.setEnd(node, index + text.length);
          
          highlight.add(range);
          results.push({ range, highlight });
          
          startPos = index + text.length;
        }
      }
    };
    
    // Rechercher dans le titre s'il existe
    const titleElement = document.querySelector('.title-plugin');
    if (titleElement) {
      addMatchesInElement(titleElement as HTMLElement);
    }

    addMatchesInElement(element);
    return results;
  };

  // Fonction pour mettre à jour les surlignages
  const updateHighlights = useCallback((text: string, editorElement: HTMLElement) => {
    if (!text.trim()) {
      clearHighlights();
      return [];
    }

    const results = findMatches(text, editorElement);
    const highlight = results[0]?.highlight || new Highlight();
    
    window.CSS.highlights?.set('search-highlight', highlight);

    updateSearchState({
      results,
      currentIndex: results.length > 0 ? 0 : -1,
      isActive: results.length > 0,
      text
    });

    return results;
  }, [clearHighlights, updateSearchState]);

  // Fonction pour naviguer entre les résultats
  const navigateToMatch = useCallback((
    direction: 'next' | 'prev' | 'first' | '',
    ranges: SearchResult[],
    currentIndex: number,
    position?: number
  ): number => {
    if (ranges.length === 0) return -1;

    let newIndex = currentIndex;

    if (typeof position === 'number' && direction === '') {
      newIndex = Math.min(position, ranges.length - 1);
    } else if (direction === 'first') {
      newIndex = 0;
    } else if (direction === 'next') {
      newIndex = (currentIndex + 1) % ranges.length;
    } else {
      newIndex = (currentIndex - 1 + ranges.length) % ranges.length;
    }

    const { range } = ranges[newIndex];
    const selection = window.getSelection();
    
    if (selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(range.cloneRange());
        
        const node = range.startContainer;
        const scrollOptions = { 
          behavior: 'smooth' as const, 
          block: 'center' as const,
          inline: 'nearest' as const
        };

        if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
          node.parentElement.scrollIntoView(scrollOptions);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          (node as Element).scrollIntoView(scrollOptions);
        }

        return newIndex;
      } catch (e) {
        console.error('Navigation error:', e);
        return currentIndex;
      }
    }

    return currentIndex;
  }, []);

  return {
    searchState,
    updateSearchState,
    clearHighlights,
    updateHighlights,
    navigateToMatch
  };
};

export default useSearch;