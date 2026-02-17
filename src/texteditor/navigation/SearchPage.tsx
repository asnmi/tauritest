import { useEffect} from 'react';
import { useGlobalContext, SearchResult } from '../context/GlobalContext';
import {globalSearch}  from './GlobalSearch';
import { useFile } from './FileHooks';

declare global {
  interface Window {
    CSS: {
      highlights: Map<string, Highlight>;
    };
  }
}

const SearchPage = () => {
  const { searchResult, setSearchResult } = useGlobalContext();
  const { handleSearch, handleNavigate } = globalSearch();
  const { openEditorWithUpdate } = useFile();

  // Effet pour vider les résultats lors du démontage du composant
  useEffect(() => {
    return () => {
      setSearchResult([]);
    };
  }, [setSearchResult]);

  const { occurance } = useGlobalContext();

  return (
    <div className="p-4 max-w-3xl mx-auto">

      {searchResult.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {searchResult.length} résultat(s) trouvé(s)
          </p>
          {searchResult.map((result, index) => {
            const fileName = result.filePath.split('/').pop() || 'Sans titre';
            return (
              <div 
                key={`${result.filePath}-${index}`}
                className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  const r = result as SearchResult;
                  //TODO adjust
                   const newItem = {
                    id: Date.now()+'',
                    title: 'r.title',
                    path: 'r.filePath',
                    cache: '',
                    created_at: Date.now(),
                    updated_at: Date.now()
                    }
                  openEditorWithUpdate(newItem);
                  setTimeout(()=>{
                    handleSearch(occurance || '');
                    handleNavigate(r.position);
                  },100);
                }}
              >
                <h3 className="font-medium">{fileName}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {result.line}
                </p>
                <div className="text-xs text-gray-400 mt-2">
                  Chemin: {result.filePath}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default SearchPage;