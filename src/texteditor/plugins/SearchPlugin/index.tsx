// src/texteditor/plugins/SearchPlugin/index.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useRef } from 'react';
import SearchBar from './SearchBar';
import useSearch from './SearchHook';

declare global {
  interface Window {
    CSS: {
      highlights: Map<string, Highlight>;
    };
  }
}

const SearchPlugin = ({ onClose }: { onClose?: () => void }) => {
  const [editor] = useLexicalComposerContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    searchState,
    updateSearchState,
    clearHighlights,
    updateHighlights,
    navigateToMatch: navigate
  } = useSearch();

  // Gestionnaire de recherche
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    updateSearchState({ text });
    const editorElement = editor.getRootElement();
    if (editorElement) {
      updateHighlights(text, editorElement);
    }
  }, [editor, updateSearchState, updateHighlights]);
  
    const handleNavigate = useCallback((direction: 'next' | 'prev' | 'first' | '') => {
    const newIndex = navigate(
      direction,
      searchState.results,
      searchState.currentIndex
    );
    if (newIndex !== searchState.currentIndex) {
      updateSearchState({ currentIndex: newIndex });
    }
  }, [navigate, searchState.results, searchState.currentIndex, updateSearchState]);

  return (
    <SearchBar
      searchText={searchState.text}
      onSearchChange={handleSearch}
      onSearchClick={() => handleNavigate('first')}
      onPrevResult={() => handleNavigate('prev')}
      onNextResult={() => handleNavigate('next')}
      onClose={() => {
        if (onClose) onClose();
        clearHighlights();
      }}
      resultsCount={searchState.results.length}
      currentResultIndex={searchState.currentIndex}
      inputRef={inputRef}
      isSearching={searchState.isActive}
    />
  );
};

export default SearchPlugin;