import { type JSX , useRef, useCallback} from 'react';
import './NavigationBar.css';
import { navigate } from '../../state_manager/navigate';
import { useFile } from './FileHooks';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";
import { ArrowLeft, ArrowRight, Home, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from '../context/NavigationContext';
import { useGlobalContext, SearchResult } from '../context/GlobalContext';
import { invoke } from '@tauri-apps/api/tauri';
import KanbanBoard from '@/modules/kanban/KanbanBoard';
import Schedule from '@/modules/schedule/Schedule';
import TodoList from '@/modules/todolist/todolist';
import { ReorderableList } from '@/modules/reordablelist/ReorderableList';

export default function NavigationBar(): JSX.Element {
  const {
    canGoBack,
    canGoForward,
    updateItemHistory,
    itemPage,
    goBack,
    goForward,
    history,
    currentIndex
  } = useNavigation();

  const {
    documentIsModified,
    setModified,
    setSearchResult,
    setOccurance
    } = useGlobalContext();

  const{
    openEditor,
    handleNewFile,
    handleOpenFile,
    handleSaveFile
  } = useFile();

  const { currentPage, navigateTo } = navigate();
  const searchInput = useRef<HTMLInputElement | null>(null);

    const handleGoBack = async () => {
    if (canGoBack) {
      goBack();
      const item = history[currentIndex - 1];
        const id = item.id;
        if(id?.includes('search')){
          handleSearch(item.title);
        } else if (item.path) {
          openEditor(item);
        }
    }
  };

  const handleGoForward = async () => {
    if (canGoForward) {
      goForward();
      const item = history[currentIndex + 1];
        const id = item.id;
        if(id?.includes('search')){
          handleSearch(item.title);
        } else if (item.path) {
          openEditor(item);
        }
    }
  };

    const searchInFiles = useCallback(async (searchTerm: string): Promise<SearchResult[]> => {
      const results: SearchResult[] = [];
      for (const note of itemPage) {

        let num = 0;
        if(note.title.includes(searchTerm)){
          let startIndex = 0;
          let index;
          while ((index = note.title.indexOf(searchTerm, startIndex)) > -1) {
              results.push({
                  filePath: note.path || '',
                  line: note.title,
                  position: num,
                  node: 'title'
              });
              startIndex = index + searchTerm.length;
              num = num+1;
          }
        }
        
        const content = await invoke('read_file', { path: note.path }) as string;
        const data = JSON.parse(content);
        const root = data.editorState.root;
        root.children.forEach((node: any) => {
          if(node.type === 'paragraph'){
            node.children.forEach((child: any) => {
              let text = child.text ;
              if(text.includes(searchTerm)){
                let startIndex = 0;
                let index;
                while ((index = text.indexOf(searchTerm, startIndex)) > -1) {
                    results.push({
                        filePath: note.path || '',
                        line: text,
                        position: num,
                        node: node.type
                    });
                    startIndex = index + searchTerm.length;
                    num = num+1;
                }
              }
            });
          }
        });
        }
      return results;
    }, [history]);
    
    const handleSearch = async (searchValue : string) => {
      navigateTo('search');
      setOccurance(searchValue);
      setSearchResult(await searchInFiles(searchValue));
    };
    

  return (
    <div className="nav-bar">
      <Menubar>
        <div className="menu-logo">MyApp</div>
        {currentPage === 'editor' || currentPage === 'search'? (
            <div className="flex items-center space-x-2">
            <Button
                variant="ghost"
                size="icon"
                disabled={!canGoBack}
                onClick={handleGoBack}
                className="text-gray-500 hover:text-gray-700"
                title="Précédent"
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                disabled={!canGoForward}
                onClick={handleGoForward}
                className="text-gray-500 hover:text-gray-700"
                title="Suivant"
            >
                <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
                onClick={() => {
                  navigateTo('home');
                  setModified({ type: '', key: '', id: '' });
                }}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                title="Accueil"
            >
                <Home className="h-4 w-4" />
            </Button>
        </div>) : null}
        <div className="menu-search-container">
          <input
            type="text"
            placeholder="Search Google or type a URL"
            className="menu-search"
            ref={searchInput}
          />
          <button 
            onClick={()=>{
              const searchValue = searchInput.current?.value || '';
              const newItem = {
                id: 'search-'+searchValue+'-'+Date.now(),
                title: searchValue,
                path: 'search/'+searchValue,
                created_at: Date.now(),
                updated_at: Date.now(),
                cache: ''
              };
              updateItemHistory(newItem);
              handleSearch(searchValue);
            }}
            className="search-button"
            title="Lancer la recherche"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>

        <MenubarMenu>
          <MenubarTrigger>Fichier {documentIsModified() ? (<span className="text-red-500">*</span>) : null}</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={()=>{
                handleNewFile();
            }}>
              Nouveau <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={()=>{
                handleOpenFile();
            }}>
                Ouvrir... <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
                disabled = {!documentIsModified()}
                onClick={()=>{
                    handleSaveFile();
                }}>
              Enregistrer <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => {
                navigateTo('history');
              }}>
              Historique
            </MenubarItem>
            <MenubarSeparator />
            {/* Submenu Features */}
            <MenubarSub>
              <MenubarSubTrigger>Features</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={() => navigateTo('editor')}>
                  Notes
                </MenubarItem>
                <MenubarItem onClick={() => navigateTo('schedule')}>
                  Emploi du temps
                </MenubarItem>
                <MenubarItem onClick={() => navigateTo('todolist')}>
                  Liste de tâches
                </MenubarItem>
                <MenubarItem onClick={() => navigateTo('reorderablelist')}>
                  Reorderable List
                </MenubarItem>
                <MenubarItem onClick={() => navigateTo('kanban')}>
                  Kanban
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>


      {<main className="p-4">
          {/*{currentPage === 'notes' && <Home />}*/}
          {currentPage === 'schedule' && <Schedule />}
          {currentPage === 'todolist' && <TodoList />}
          {/*{currentPage === 'reorderablelist' && 
            <ReorderableList
              items={items}
              onReorder={setItems}
              renderItem={(item, isDragging) => (
                <div className={`p-4 bg-white rounded-lg shadow ${isDragging ? 'ring-2 ring-blue-500' : ''}`}>
                  {item.content}
                </div>
              )}
              itemClassName="transition-transform duration-200"
            />
          }*/}
          {currentPage === 'kanban' && <KanbanBoard />}
      </main>}
    </div>
  );
}