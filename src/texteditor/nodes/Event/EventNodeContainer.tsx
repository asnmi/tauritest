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

export type SerializedEventNodeContainer = Spread<
  {
    //none
  },
  SerializedElementNode
>;

export class eventNodeContainer extends ElementNode {
  static getType(): string {
    return 'event-node-container';
  }

  static clone(node: eventNodeContainer): eventNodeContainer {
    return new eventNodeContainer(node.__key);
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
    element.className = 'event-node-container';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'event-node-container';
    element.setAttribute('spellcheck', 'false');
    return { element };
  }

static importDOM(): DOMConversionMap | null {
  return {
    div: (domNode: HTMLElement) => 
      domNode.classList.contains('event-node-container') 
        ? { 
            conversion: () => ({ node: $createEventNodeContainer() }), 
            priority: 1 
          }
        : null
  };
}

  static importJSON(serializedNode: SerializedEventNodeContainer)
  : eventNodeContainer
  {
    if (serializedNode.children) {
      // La gestion des enfants se fera automatiquement par Lexical
      // car nous avons défini la méthode canInsert* appropriée
    }
    return $createEventNodeContainer().updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedEventNodeContainer {
    return {
      ...super.exportJSON()
    };
  }
}

export function $createEventNodeContainer(): eventNodeContainer {
  return new eventNodeContainer();
}

export function $isEventNodeContainer(
  node: LexicalNode | null | undefined,
): node is eventNodeContainer {
  return node instanceof eventNodeContainer;
}