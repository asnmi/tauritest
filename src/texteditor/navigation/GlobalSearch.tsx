import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback } from "react";
import useSearch from '../plugins/SearchPlugin/SearchHook';

declare global {
  interface Window {
    CSS: {
      highlights: Map<string, Highlight>;
    };
  }
}

export const globalSearch = () => {
  const [editor] = useLexicalComposerContext();

      const {
        searchState,
        updateSearchState,
        clearHighlights,
        updateHighlights,
        navigateToMatch
      } = useSearch();

      let ranges: any;
    
      // Gestionnaire de recherche
      const handleSearch = useCallback((text : string) => {
        updateSearchState({ text });
        const editorElement = editor.getRootElement();
        if (editorElement) {
          ranges = updateHighlights(text, editorElement);
        }
      }, [editor, updateSearchState, updateHighlights]);
      
        const handleNavigate = useCallback((position : number) => {
        const newIndex = navigateToMatch(
          '',
          ranges,
          searchState.currentIndex,
          position
        );
        if (newIndex !== searchState.currentIndex) {
          updateSearchState({ currentIndex: newIndex });
        }
      }, [navigateToMatch, searchState.results, searchState.currentIndex, updateSearchState]);
    



  return {
    handleSearch,
    handleNavigate,
    clearHighlights
  }
}