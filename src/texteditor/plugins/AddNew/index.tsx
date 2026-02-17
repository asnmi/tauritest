import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { useEffect } from 'react';

function handleClick(event: MouseEvent, editor: any) {
  const target = event.target as HTMLElement;

  // Only handle clicks on the editor container
  if (!target.closest('.editor')) {
    return;
  }

  // Only handle clicks on the editor content area
  const contentEditable = target.closest('.ContentEditable__root');
  if (!contentEditable) {
    return;
  }

  // Get the last child of the root
  editor.update(() => {
    const root = $getRoot();
    const lastChild = root.getLastChild();

    // If no content, create a new paragraph
    if (!lastChild) {
      const paragraph = $createParagraphNode();
      root.append(paragraph);
      paragraph.selectEnd();
      return;
    }

    // Check if click is below the last block
    const lastElement = lastChild.getLatest();
    const domElement = editor.getElementByKey(lastElement.__key);

    if (domElement) {
      const rect = domElement.getBoundingClientRect();
      const isClickBelowLastBlock = event.clientY > rect.bottom + 10; // 10px threshold

      if (isClickBelowLastBlock) {
        const selection = $getSelection();
        const paragraph = $createParagraphNode();

        if ($isRangeSelection(selection)) {
          //const focusNode = selection.focus.getNode();

          // If the last node is empty, just focus it instead of creating a new one
          if (lastChild.getTextContent().trim() === '') {
            lastChild.selectEnd();
            return;
          }

          // Otherwise, create a new paragraph after the last one
          lastChild.insertAfter(paragraph);
          paragraph.select();
        } else {
          // Fallback: append to root
          root.append(paragraph);
          paragraph.selectEnd();
        }
      }
    }
  });
}

export default function ClickToAddParagraphPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const onClick = (event: MouseEvent) => handleClick(event, editor);

    // Add click event listener
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
    };
  }, [editor]);

  return null;
}