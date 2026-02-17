// En haut du fichier, après les imports
import { waitFor } from '@testing-library/dom';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalNode } from 'lexical';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderEditor } from './testUtils';
import { LexicalEditor } from 'lexical';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { logger } from '@/logger/logger';
import type { Mock } from 'vitest'
import * as blocDatabase from '@/texteditor/database/useBlocDatabase';

vi.mock('@/texteditor/database/useBlocDatabase', () => ({
  // Constantes
  SUCCESS: 1,
  ERROR: -1,
  NO_CHANGE: 0,
  
  // Fonctions mockées
  updateBlocContent: vi.fn().mockResolvedValue(1), // SUCCESS par défaut
  updateBlocPosition: vi.fn().mockResolvedValue(1), // SUCCESS par défaut
  deleteBloc: vi.fn().mockResolvedValue(true),
  newBloc: vi.fn().mockResolvedValue('mocked-bloc-id'),
  
  // Mock pour l'initialisation
  init_db: vi.fn().mockResolvedValue(undefined), // ou mockResolvedValue(true) selon votre implémentation
  
  // ... autres fonctions que vous utilisez
}));

describe('Lexical Editor Tests', () => {
    let originalConsoleLog: typeof console.log;

    // Sauvegarder et mocker console.log avant les tests
    beforeAll(() => {
        originalConsoleLog = console.log;
        console.log = vi.fn(originalConsoleLog);
    });

    // Restaurer console.log après les tests
    afterAll(() => {
        console.log = originalConsoleLog;
    });

    beforeEach(() => {
        vi.clearAllMocks();

          // Configurer le mock pour simuler une initialisation réussie
  (blocDatabase.newBloc as Mock).mockResolvedValue(undefined);
  
  // Réinitialiser les mocks à leurs valeurs par défaut
  (blocDatabase.updateBlocContent as Mock).mockResolvedValue(blocDatabase.SUCCESS);
  (blocDatabase.newBloc as Mock).mockResolvedValue('mocked-bloc-id');
  // ... autres réinitialisations nécessaires
    });

    it('should insert text using Lexical API and log addBlocManager calls', async () => {
        // 1. Rendu de l'éditeur
        const { editor, editorInstance } = renderEditor();
        if (!editorInstance) {
            throw new Error('Editor instance not found');
        }
        const ed = editorInstance as LexicalEditor;

        // 2. Attendre que l'éditeur soit prêt
        await waitFor(() => {
            expect(editor).toBeInTheDocument();
        });

        // 3. Utiliser l'API Lexical
        let key1: string = '';
        await act(async () => {
            await new Promise<void>((resolve) => {
                ed.update(() => {
                    const root = $getRoot();
                    const paragraph = $createParagraphNode();
                    const textNode = $createTextNode('A');
                    paragraph.append(textNode);
                    root.clear().append(paragraph);
                    key1 = paragraph.__key;
                    resolve();
                });
            });
        });

        // 1. Initialisation et vérification du premier bloc
        editor.setAttribute('contenteditable', 'true');
        editor.focus();
        // Avant de taper 'Mon', vérifions d'abord le contenu initial
        await act(async () => {
            ed.update(() => {
                const firstParagraph = ed.getEditorState().
                    _nodeMap.get(key1);
                expect(firstParagraph?.getTextContent()).toBe('A');
            });
        });

        // Puis tapons 'Mon' (cela va ajouter 'Mon' après le 'A' existant)
        await userEvent.type(editor, 'Mon');
        await act(async () => {
            ed.update(() => {
                const firstParagraph = ed.getEditorState().
                    _nodeMap.get(key1);
                expect(firstParagraph?.getTextContent()).toBe('AMon');
            });
        });

        //await userEvent.keyboard('{Enter}');

        await act(async () => {
            ed.update(() => {
                const firstNode = $getRoot().getFirstChild();
                if (firstNode) {
                    const newParagraph = $createParagraphNode();
                    const textNode = $createTextNode('B');
                    newParagraph.append(textNode);
                    firstNode.insertAfter(newParagraph);
                    expect($getRoot().getLastChild()).not.toBeNull();
                }
            });
        });


        await userEvent.type(editor, 'tes', { delay: 10 });

        await act(async () => {
            await userEvent.keyboard('{Control>}z{/Control}');
        });

        await act(async () => {
            ed.update(() => {
                const root = $getRoot();
                const paragraph = root.getLastChild();
                expect(paragraph?.getTextContent()).toBe('B');
            });
        });

        // 7. Simuler un REDO (Ctrl+Shift+Z ou Ctrl+Y)
        await act(async () => {
            const redoEvent = new KeyboardEvent('keydown', {
                key: 'y',
                ctrlKey: true,
                bubbles: true
            });
            editor.dispatchEvent(redoEvent);
        });

        // 8. Vérifier que le REDO a fonctionné
        await act(async () => {
            ed.update(() => {
                const root = $getRoot();
                const paragraph = root.getLastChild();
                expect(paragraph?.getTextContent()).toBe('Btes');
            });
        });

        let lastChild: LexicalNode | null = null;
        await act(async () => {
            ed.update(() => {
                const root = $getRoot();
                lastChild = root.getLastChild();
                if (lastChild) {
                    lastChild.remove();
                }
            });
        });
        await act(async () => {
            ed.update(() => {
                if (lastChild) {
                    const nodeStillExists = ed.getEditorState()._nodeMap.has(lastChild.__key);
                    expect(nodeStillExists).toBe(false);
                }
            });
        });

        await act(async () => {
            ed.update(() => {
                const root = $getRoot();
                const paragraph = root.getLastChild();
                console.log('Contenu après frappe:', paragraph?.getTextContent());
            });
        });

        console.log(logger.getLogs());
    });
}, 10000);