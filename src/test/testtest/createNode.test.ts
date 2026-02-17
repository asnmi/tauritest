import { $createParagraphNode, $createTextNode, $getRoot, createEditor, LexicalEditor } from 'lexical';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('Test avec fonctions Lexical', () => {
  let editor: LexicalEditor;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    editor = createEditor({
      namespace: 'TestEditor',
      nodes: [],
      onError: (error) => {
        throw error;
      },
    });
  });

  afterEach(() => {
    editor = null as unknown as LexicalEditor; // Reset editor
    container.remove();
  });

  test('Test de création de contenu', async () => {
    // 1. Créer le contenu
    await new Promise<void>((resolve) => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const text = $createTextNode('Hello World');
        paragraph.append(text);
        root.append(paragraph);
        resolve();
      });
    });

    // 2. Vérifier le contenu
    await new Promise<void>((resolve) => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        expect(children.length).toBe(1);
        
        const paragraph = children[0];
        const paragraphText = paragraph.getTextContent();
        expect(paragraphText).toBe('Hello World');
        resolve();
      });
    });
  });
});