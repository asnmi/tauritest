// src/texteditor/plugins/SearchPlugin/SearchBar.tsx
import React from 'react';
import Portal from './Portal';
import './SearchBar.css'; // Créez ce fichier pour les styles

interface SearchBarProps {
  searchText: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClick: () => void;
  onPrevResult: (e: React.MouseEvent) => void;
  onNextResult: (e: React.MouseEvent) => void;
  onClose: (() => void) | undefined;
  resultsCount: number;
  currentResultIndex: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isSearching: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchText,
  onSearchChange,
  onSearchClick,
  onPrevResult,
  onNextResult,
  onClose,
  resultsCount,
  currentResultIndex,
  inputRef,
  isSearching,
}) => {
  return (
    <Portal>
      <div className="search-bar-overlay">
        <div className="search-bar-container">
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={onSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchClick();
              }
            }}
            placeholder="Rechercher..."
            className="search-input"
          />
          <button 
            onClick={onSearchClick}
            className="search-button"
            disabled={!searchText}
            title="Lancer la recherche"
          >
            🔍
          </button>
          {isSearching && resultsCount > 0 && (
            <span className="search-counter">
              {currentResultIndex + 1} / {resultsCount}
            </span>
          )}
          <button 
            onClick={onPrevResult} 
            disabled={!isSearching || resultsCount === 0}
            className="search-button"
            title="Résultat précédent"
          >
            &uarr;
          </button>
          <button 
            onClick={onNextResult} 
            disabled={!isSearching || resultsCount === 0}
            className="search-button"
            title="Résultat suivant"
          >
            &darr;
          </button>
          <button 
            onClick={onClose}
            className="search-close-button"
            title="Fermer la recherche"
          >
            ×
          </button>
        </div>
      </div>
    </Portal>
  );
};

export default SearchBar;