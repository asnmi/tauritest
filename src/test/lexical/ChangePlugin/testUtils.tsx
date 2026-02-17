
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { ChangePlugin } from '@/texteditor/plugins/ChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { LexicalEditor, ParagraphNode, TextNode } from 'lexical';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { GlobalContextProvider } from '@/texteditor/context/GlobalContext';
import { NavigationProvider } from '@/texteditor/context/NavigationContext';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const renderEditor = () => {
  let editorInstance: LexicalEditor | null = null;
      const initialConfig = {
        namespace: 'TestEditor',
        theme: {},
        onError: (error: Error) => {
            throw error;
        },
        nodes: [HeadingNode, QuoteNode, ParagraphNode, TextNode],
    };
  const EditorWithRef = () => {
    const [editor] = useLexicalComposerContext();
    editorInstance = editor;
    return null;
  };

  const result = render(
    <LexicalComposer initialConfig={initialConfig}>
      <GlobalContextProvider>
        <NavigationProvider>
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                data-testid="content-editable"
                style={{ minHeight: '100px' }}
              />
            }
            placeholder={<div>Écrivez quelque chose...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ChangePlugin />
          <HistoryPlugin />
          <EditorWithRef />
        </NavigationProvider>
      </GlobalContextProvider>
    </LexicalComposer>
  );

  const editor = screen.getByTestId('content-editable');

  return {
    ...result,
    editor,
    editorInstance,
    user: userEvent.setup({
      delay: 100
    }),
  };
};