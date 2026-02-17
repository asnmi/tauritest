/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import {
  $isTextNode,
  defineExtension,
  DOMConversionMap,
  TextNode,
} from 'lexical';
import { type JSX, useEffect, useMemo } from 'react';

import { FlashMessageContext } from './context/FlashMessageContext';
import { SettingsContext, useSettings } from './context/SettingsContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { ToolbarContext } from './context/ToolbarContext';
import { MathVariablesProvider } from './context/MathVariablesContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import { TableContext } from './plugins/TablePlugin';
import { parseAllowedFontSize } from './plugins/ToolbarPlugin/fontSize';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { parseAllowedColor } from './ui/ColorPicker';
import { NavigationProvider } from './context/NavigationContext';
import Home from './navigation/homepage';
import HistoryPage from './navigation/HistoryPage';
import NavigationBar from './navigation/NavigationBar';
import { GlobalContextProvider } from './context/GlobalContext';
import { navigate } from '@/state_manager/navigate';
import SearchPage from './navigation/SearchPage';
import './main.css';
import './left.css';
import './right.css';
import { initDatabase } from './database/useDatabase';

console.warn(
  'If you are profiling the playground app, please ensure you turn off the debug view. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.',
);

function getExtraStyles(element: HTMLElement): string {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
}

function buildImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
}

function App(): JSX.Element {
  const {
    settings: { isCollab, emptyEditor, measureTypingPerf },
  } = useSettings();

  // Charger le fichier JSON au démarrage
  /*
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
    const loadDemoTexts = async () => {
      try {
        const response = await fetch('/files/acc.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEditorState(JSON.stringify(data.editorState));
      } catch (error) {
        console.error('Erreur lors du chargement du fichier demo_texts.json:', error);
        // En cas d'erreur, utiliser le contenu par défaut
        setEditorState(null);
      } finally {
        setIsLoading(false);
      }
    };
 
    loadDemoTexts();
  }, []);*/


  const app = useMemo(
    () =>
      defineExtension({
        html: { import: buildImportMap() },
        name: '@lexical/playground',
        namespace: 'Playground',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [emptyEditor, isCollab],
  );

  useEffect(() => {
    // Créer et ajouter le style pour le surlignage
    const style = document.createElement('style');
    style.textContent = `
      ::highlight(search-highlight) {
        background-color: rgba(255, 255, 0, 0.5);
        color: inherit;
      }
    `;
    document.head.appendChild(style);

    // Nettoyage
    return () => {
      document.head.removeChild(style);
      window.CSS.highlights?.delete('search-highlight');
    };
  }, []);

  const { currentPage } = navigate();

  // TODO: use a loader
  new Promise<void>((resolve, reject) => {
    initDatabase('/Users/solofonirina/Documents/myapp.db')
      .then(() => resolve())
      .catch(reject);
  })
  .then(() => {
    console.log('Database initialized');
  })
  .catch(error => {
    console.error('Database init failed:', error);
  });

  return (
    <MathVariablesProvider>
      <LexicalExtensionComposer extension={app} contentEditable={null}>
        <NavigationProvider>
          <NavigationBar />

          {currentPage === 'home' ? (
            <Home />
          ) :
            (currentPage === 'editor' ? (
              <SharedHistoryContext>
                <TableContext>
                  <ToolbarContext>
                    <Editor />
                    <div>
                      <div className='left-container'>
                      </div>
                      <div className='right-container'>
                      </div>
                    </div>
                    <Settings />
                    {measureTypingPerf ? <TypingPerfPlugin /> : null}
                  </ToolbarContext>
                </TableContext>
              </SharedHistoryContext>
            ) :
              (currentPage === 'history' ? (
                <HistoryPage />
              ) :
                (currentPage === 'search' ? (
                  <SearchPage />
                ) : null)))}

        </NavigationProvider>
      </LexicalExtensionComposer>
    </MathVariablesProvider>
  );
}

export default function PlaygroundApp(): JSX.Element {
  return (
    <SettingsContext>
      <GlobalContextProvider>
        <FlashMessageContext>
          <App />
        </FlashMessageContext>
      </GlobalContextProvider>
    </SettingsContext>
  );
}
