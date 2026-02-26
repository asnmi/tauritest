/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from 'react';

import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { CAN_USE_DOM } from '@lexical/utils';
import { useEffect, useState } from 'react';

import { useSettings } from './context/SettingsContext';
import { useSharedHistoryContext } from './context/SharedHistoryContext';
import ActionsPlugin from './plugins/ActionsPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import CodeHighlightPrismPlugin from './plugins/CodeHighlightPrismPlugin';
import CodeHighlightShikiPlugin from './plugins/CodeHighlightShikiPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import EquationsPlugin from './plugins/EquationsPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import { LayoutPlugin } from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import MarkdownShortcutPlugin from './plugins/MarkdownShortcutPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import MentionsPlugin from './plugins/MentionsPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import SpecialTextPlugin from './plugins/SpecialTextPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TableHoverActionsPlugin from './plugins/TableHoverActionsPlugin';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import MathPlugin from './plugins/MathPlugin';
import InvokerPlugin from './plugins/InvokerPlugin';
import AddNewPlugin from './plugins/AddNew';
import TitlePlugin from './plugins/TitlePlugin'
import { ChangePlugin } from './plugins/ChangePlugin'
import './editor.css'
import EventPlugin from './plugins/EventPlugin';

export default function Editor(): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      hasLinkAttributes,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
      listStrictIndent,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const placeholder = isCollab
    ? 'Enter some collaborative rich text...'
    : isRichText
      ? 'Enter some rich text...'
      : 'Enter some plain text...';
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  useEffect(() => {
    setTimeout(() => {
      editor.focus();
    }, 0);
  }, [editor]);

  return (
    <div>
      <div>
        {isRichText && (
          <ToolbarPlugin
            editor={editor}
            activeEditor={activeEditor}
            setActiveEditor={setActiveEditor}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        )}
      </div>

      <div className='editor-shell'>
        <ChangePlugin />
        {isRichText && (
          <ShortcutsPlugin
            editor={activeEditor}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        )}
        <div
          className={`editor-container ${showTreeView ? 'tree-view' : ''} ${!isRichText ? 'plain-text' : ''
            }`}>
          {isMaxLength && <MaxLengthPlugin maxLength={30} />}
          <DragDropPaste />
          {selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
          <ClearEditorPlugin />
          <ComponentPickerPlugin />
          <AutoEmbedPlugin />
          <MentionsPlugin />
          <HashtagPlugin />
          <AutoLinkPlugin />
          {isRichText ? (
            <>
              <TitlePlugin />
              <HistoryPlugin externalHistoryState={historyState} />
              <RichTextPlugin
                contentEditable={
                  <div className="editor-scroller">
                    <div className="editor" ref={onRef}>
                      <ContentEditable placeholder={placeholder} />
                    </div>
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <MathPlugin />
              <EventPlugin />
              <InvokerPlugin />
              <AddNewPlugin />
              <MarkdownShortcutPlugin />
              {isCodeHighlighted &&
                (isCodeShiki ? (
                  <CodeHighlightShikiPlugin />
                ) : (
                  <CodeHighlightPrismPlugin />
                ))}
              <ListPlugin hasStrictIndent={listStrictIndent} />
              <CheckListPlugin />
              <TablePlugin
                hasCellMerge={tableCellMerge}
                hasCellBackgroundColor={tableCellBackgroundColor}
                hasHorizontalScroll={tableHorizontalScroll}
              />
              <TableCellResizer />
              <ImagesPlugin />
              <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
              <YouTubePlugin />
              <ClickableLinkPlugin disabled={isEditable} />
              <HorizontalRulePlugin />
              <EquationsPlugin />
              <TabFocusPlugin />
              <TabIndentationPlugin maxIndent={7} />
              <CollapsiblePlugin />
              <PageBreakPlugin />
              <LayoutPlugin />
              {floatingAnchorElem && (
                <>
                  <FloatingLinkEditorPlugin
                    anchorElem={floatingAnchorElem}
                    isLinkEditMode={isLinkEditMode}
                    setIsLinkEditMode={setIsLinkEditMode}
                  />
                  <TableCellActionMenuPlugin
                    anchorElem={floatingAnchorElem}
                    cellMerge={true}
                  />
                </>
              )}
              {floatingAnchorElem && !isSmallWidthViewport && (
                <>
                  <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                  <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                  <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                </>
              )}
            </>
          ) : (
            <>
              <PlainTextPlugin
                contentEditable={<ContentEditable placeholder={placeholder} />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin externalHistoryState={historyState} />
            </>
          )}
          {(isCharLimit || isCharLimitUtf8) && (
            <CharacterLimitPlugin
              charset={isCharLimit ? 'UTF-16' : 'UTF-8'}
              maxLength={5}
            />
          )}
          {isAutocomplete && <AutocompletePlugin />}
          <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
          {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
          {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />}
          <ActionsPlugin
            isRichText={isRichText}
            shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
          />
        </div>
        {/*showTreeView && <TreeViewPlugin />*/}
      </div>
    </div>
  );
}
