import { useState, useMemo} from 'react';
import { useNavigation } from '../context/NavigationContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import { useFile } from './FileHooks';

interface HistoryItem {
  id: string;
  title: string;
  updated_at: number;
}

interface HistoryItemProps {
  item: HistoryItem;
  onOpen: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistoryItem = ({ item, onOpen, onDelete }: HistoryItemProps) => (
  <div className="flex items-center justify-between p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <div 
      className="flex-1 cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {item.title || 'Sans titre'}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
        <Clock className="w-3 h-3 mr-1" />
         {new Date(item.updated_at).toLocaleString()}
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="text-gray-400 hover:text-red-500"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(item.id);
      }}
    >
      <X className="w-4 h-4" />
    </Button>
  </div>
);

export default function HistoryPage() {
  const { 
    itemPage, 
    history,
    removeFromHistory,
    clearHistory
  } = useNavigation();

  const {
    openEditorWithUpdate
  } = useFile();

  const [searchQuery, setSearchQuery] = useState('');

const recentFiles = useMemo(() => {
  return [...history]
    .filter((item): item is any => {
      return item && 'path' in item && 'title' in item && 'updated_at' in item;
    })
    .sort((a, b) => {
      // Utilise lastOpened s'il existe, sinon utilise timestamp
      const timeA = a.updated_at;
      const timeB = b.updated_at;
      return timeB - timeA;  // Tri du plus récent au plus ancien
    })
    .slice(0, 10);
    
}, [itemPage]);

  const handleDeleteItem = (id: string) => {
    removeFromHistory(id);
  };

  const handleClearAll = () => {
    clearHistory();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historique des documents
        </h1>
        {recentFiles.length > 0 && (
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 flex items-center"
            onClick={handleClearAll}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Tout effacer
          </Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher dans l'historique..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
        {recentFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? (
              <>
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Aucun résultat pour "{searchQuery}"</p>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <Clock className="w-8 h-8 mb-2 text-gray-400" />
                <p>Votre historique est vide</p>
                <p className="text-sm text-gray-400 mt-1">
                  Les documents que vous ouvrirez apparaîtront ici
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[70vh] overflow-y-auto">
            {recentFiles.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onOpen={()=>{
                  openEditorWithUpdate(item.filePath);
                }}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}