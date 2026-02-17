import React, { useRef, useEffect, useCallback } from 'react';
import './TitlePlugin.css';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useGlobalContext } from '../../context/GlobalContext';
import { KEY_ARROW_UP_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useNavigation } from '@/texteditor/context/NavigationContext';
import { updatePageTitle } from '@/texteditor/database/usePageDatabase';

const TitlePlugin = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [editor] = useLexicalComposerContext();
  const {
    setModified,
    modified,
    documentIsModified,
    setTitle,
    title
  } = useGlobalContext();

  const {
    getCurrentItemFromHistory
  } = useNavigation();

  const currentTitle = title;
  const lastCaretPos = useRef<number>(0);

  const setCursorToEnd = useCallback((element: HTMLElement) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    lastCaretPos.current = element.textContent?.length || 0;
  }, []);

  const updateCaretPos = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && titleRef.current) {
      const range = selection.getRangeAt(0);
      if (titleRef.current.contains(range.startContainer)) {
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          lastCaretPos.current = range.startOffset;
        } else if (range.startContainer === titleRef.current) {
          // Fallback if the selection is on the element itself
          lastCaretPos.current = 0;
        }
      }
    }
  };

  useEffect(() => {
    if (titleRef.current && currentTitle !== titleRef.current.textContent) {
      titleRef.current.textContent = currentTitle;
      setCursorToEnd(titleRef.current);
    }
  }, [currentTitle, setCursorToEnd]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      editor.focus();
    }
    // We don't update caret pos here because if we are moving focus, 
    // we want to keep the position BEFORE the move.
    // If we are just typing or moving cursor within title, onKeyUp/onInput handles it.
  };

  const handleKeyUp = () => {
    updateCaretPos();
  };

  const handleMouseUp = () => {
    updateCaretPos();
  };

  const handleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    e;
    updateCaretPos();
    setTimeout(() => {
      if (titleRef.current) {
        const newTitle = titleRef.current.textContent || '';
        setTitle(newTitle);

        if (documentIsModified() === false) {
          setModified({ type: 'title', key: getCurrentItemFromHistory().id, id: newTitle });
        }
      }
    }, 100);
  };

  // Focus on title on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const rootElement = editor.getRootElement();
            if (rootElement) {
              const rootRect = rootElement.getBoundingClientRect();
              if (rect.top - rootRect.top < 40) {
                if (titleRef.current) {
                  titleRef.current.focus();

                  // Restore caret position
                  const textNode = titleRef.current.firstChild;
                  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    const newRange = document.createRange();
                    const len = textNode.textContent?.length || 0;
                    const pos = Math.min(lastCaretPos.current, len);
                    try {
                      newRange.setStart(textNode, pos);
                      newRange.setEnd(textNode, pos);
                      const sel = window.getSelection();
                      sel?.removeAllRanges();
                      sel?.addRange(newRange);
                    } catch (e) {
                      console.warn('Failed to restore caret position in title', e);
                    }
                  } else if (titleRef.current.textContent === '') {
                    // Handle empty title case
                    // focus() already puts caret at start, which is correct for empty.
                  }

                  event.preventDefault();
                  return true;
                }
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  const handleLostFocus = async () => {
    if (documentIsModified() && modified.type === 'title') {
      await updatePageTitle(getCurrentItemFromHistory().id, title);
      setModified({ type: '', key: '', id: '' });
    }
  }

  return (
    <h1
      ref={titleRef}
      className={`title-plugin`}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onBlur={handleLostFocus}
      onKeyUp={handleKeyUp}
      onMouseUp={handleMouseUp}
      onInput={handleInput}
      data-placeholder="Enter title..."
    />
  );
};

export default TitlePlugin;