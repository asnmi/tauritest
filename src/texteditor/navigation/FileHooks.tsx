import { navigate } from "@/state_manager/navigate";
import { useGlobalContext } from "../context/GlobalContext";
import { useNavigation } from "../context/NavigationContext";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { invoke } from '@tauri-apps/api/tauri';
import { CLEAR_HISTORY_COMMAND } from "lexical";
import {
    getPageCache,
    newPage,
    PageJson,
    updatePage
} from "../database/usePageDatabase"
import { BlocJson, getBlocsByPageId, newBloc } from "../database/useBlocDatabase";

export function useFile() {
    const {
        updateItemHistory,
        updateItemPage,
        getCurrentItemFromHistory,
    } = useNavigation();

    const {
        setModified,
        title,
        setTitle,
    } = useGlobalContext();

    const { navigateTo } = navigate();
    const [editor] = useLexicalComposerContext();
    const emptyChanges = { key: '', type: '', id: ''};

    const emptybloc = {
        $: {
            id: crypto.randomUUID(),
            position: "aa",
            updateAt: 0
        },
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1
          }
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        textFormat: 0,
        textStyle: ""
    }

    const emptyEditorState = {
        root: {
            children: [
                {
                    ...emptybloc
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    };

    const loadEditorState = (editorState: any) => {
        editor.update(() => {
            const parsedState = editor.parseEditorState(JSON.stringify(editorState));
            editor.setEditorState(parsedState);
        });

        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
    };


    const openEditor = async (page: PageJson) => {
        try {
            const content = await getPageCache(page.id);
            const editorState = JSON.parse(content);
            if (editorState === null) {
                return;
            }
            navigateTo('editor');
            setTitle(page.title);
            loadEditorState(editorState);
            setModified(emptyChanges);
        } catch (error) {
            console.error('reading file error : ', error);
            throw error;
        }
    };

    async function reconstruction(page: PageJson) {
        const blocs: BlocJson[] = await getBlocsByPageId(page.id);
        const contents = blocs.map(bloc => {
            let content = JSON.parse(bloc.content);
            content.$.id = bloc.id;
            content.$.position = bloc.position;
            content.$.updateAt = bloc.updated_at;
            return content;
        });

        const ees = {
            root: {
                children: contents,
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        };

        return ees;
    }

    const openEditorWithUpdate = async (page: PageJson) => {
        try {
            let editorState = await reconstruction(page);
            /*let content: string | null = await getPageCache(page.id);

            let editorState = null;
            if (content.length === 0 || content === null) {
                editorState = emptyEditorState;
            } else {
                editorState = JSON.parse(content);
            }*/

            navigateTo('editor');
            setTitle(page.title);
            loadEditorState(editorState);

            const newItem = {
                id: page.id,
                path: page.path,
                title: page.title,
                cache: JSON.stringify(editorState),
                created_at: page.created_at,
                updated_at: Date.now()
            };
            updateItemHistory(newItem);
            setModified(emptyChanges);
        } catch (error) {
            console.error('reading file error : ', error);
            throw error;
        }
    };

    const handleNewFile = async () => {
        const newPageItem = {
            id: crypto.randomUUID(),
            title: '',
            path: 'home/',
            cache: JSON.stringify(emptyEditorState),
            created_at: Date.now(),
            updated_at: Date.now()
        };
        updateItemHistory(newPageItem);
        setTitle(newPageItem.title);
        loadEditorState(emptyEditorState);
        navigateTo('editor');
        await newPage(newPageItem);

        const newBlocItem = {
            id: emptybloc.$.id,
            position: emptybloc.$.position,
            content: JSON.stringify(emptybloc),
            page_id: newPageItem.id,
            bloc_type: 'paragraph',
            created_at: Date.now(),
            updated_at: Date.now(),
        }
        await newBloc(newBlocItem);
    };

    const handleOpenFile = async () => {
        try {
            const filePath = await invoke('open_file_dialog') as string | null;
            if (!filePath) {
                return;
            }

            const content = await invoke('read_file', { path: filePath }) as string;
            const data = JSON.parse(content);
            const editorState = data.editorState;

            if (filePath) {
                let title = '';
                if (data.title.length > 0) {
                    title = data.title;
                } else {
                    title = 'New Notes';
                }

                const newItem = {
                    id: data.id,
                    title: title,
                    path: filePath,
                    cache: JSON.stringify(editorState),
                    created_at: Date.now(),
                    updated_at: Date.now()
                };
                setTitle(title);
                updateItemHistory(newItem);
                updateItemPage(newItem);
                navigateTo('editor');
                loadEditorState(editorState);
            }
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du fichier :', error);
        }
    };

    const handleSaveFile = async () => {
        let currentItem = getCurrentItemFromHistory();

        let filePath: string = 'home/';
        if (currentItem?.path) {
            filePath = currentItem.path;
        }

        let page_id = Date.now() + '';
        if (currentItem?.id) {
            page_id = currentItem.id;
        }

        let created_at = Date.now();
        if (currentItem?.created_at) {
            created_at = currentItem.created_at;
        }

        const editorState = editor.getEditorState();
        // Mettre à jour l'historique
        const newItem = {
            id: page_id,
            path: filePath,
            title: title,
            cache: JSON.stringify(editorState),
            created_at: created_at,
            updated_at: Date.now()
        };
        updateItemHistory(newItem);
        await updatePage(newItem);
        setModified(emptyChanges);
    };

    return {
        handleOpenFile,
        handleNewFile,
        openEditor,
        handleSaveFile,
        openEditorWithUpdate
    };
}