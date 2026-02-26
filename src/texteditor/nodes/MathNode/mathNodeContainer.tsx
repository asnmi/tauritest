import { 
  ElementNode,
  LexicalNode, 
  NodeKey, 
  Spread,
  DOMExportOutput, 
  SerializedElementNode,
  DOMConversionMap,
  $isElementNode,
  $getSiblingCaret,
  $rewindSiblingCaret
} from 'lexical';

import './nodeContainer.css';

export type SerializedMathNodeContainer = Spread<
  {
    //none
  },
  SerializedElementNode
>;

export class mathNodeContainer extends ElementNode {
  static getType(): string {
    return 'math-node-container';
  }

  static clone(node: mathNodeContainer): mathNodeContainer {
    return new mathNodeContainer(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

    collapseAtStart(/*selection: RangeSelection*/): boolean {
      // Unwrap the CollapsibleContainerNode by replacing it with the children
      // of its children (CollapsibleTitleNode, CollapsibleContentNode)
      const nodesToInsert: LexicalNode[] = [];
      for (const child of this.getChildren()) {
        if ($isElementNode(child)) {
          nodesToInsert.push(...child.getChildren());
        }
      }
      const caret = $rewindSiblingCaret($getSiblingCaret(this, 'previous'));
      caret.splice(1, nodesToInsert);
      // Merge the first child of the CollapsibleTitleNode with the
      // previous sibling of the CollapsibleContainerNode
      const [firstChild] = nodesToInsert;
      if (firstChild) {
        firstChild.selectStart().deleteCharacter(true);
      }
      return true;
    }

  // Vue
  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.setAttribute('spellcheck', 'false');
    element.setAttribute('contenteditable', 'false');
    element.className = 'math-node-container';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'math-node-container';
    element.setAttribute('spellcheck', 'false');
    return { element };
  }

static importDOM(): DOMConversionMap | null {
  return {
    div: (domNode: HTMLElement) => 
      domNode.classList.contains('math-node-container') 
        ? { 
            conversion: () => ({ node: $createMathNodeContainer() }), 
            priority: 1 
          }
        : null
  };
}

  static importJSON(serializedNode: SerializedMathNodeContainer)
  : mathNodeContainer
  {
    if (serializedNode.children) {
      // La gestion des enfants se fera automatiquement par Lexical
      // car nous avons défini la méthode canInsert* appropriée
    }
    return $createMathNodeContainer().updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedMathNodeContainer {
    return {
      ...super.exportJSON()
    };
  }
}

export function $createMathNodeContainer(): mathNodeContainer {
  return new mathNodeContainer();
}

export function $isNodeContainer(
  node: LexicalNode | null | undefined,
): node is mathNodeContainer {
  return node instanceof mathNodeContainer;
}