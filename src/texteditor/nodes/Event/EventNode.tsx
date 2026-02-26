import { DecoratorNode, DOMConversionMap, DOMConversionOutput, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React,{JSX} from 'react';

// On importe le composant que nous avons créé
const EventComponent = React.lazy(() => import('./EventComponent'));

export type SerializedEventNode = Spread<
  {
    expression: string;
    type: 'event';
    version: number;
  },
  SerializedLexicalNode
>;

export class EventNode extends DecoratorNode<JSX.Element> {
  __expression: string;

  static getType(): string {
    return 'event';
  }

  static clone(node: EventNode): EventNode {
    return new EventNode(node.__expression, node.__key);
  }

  constructor(expression = '', key?: NodeKey) {
    super(key);
    this.__expression = expression;
  }

  destroy(): void {
    this.__expression = '';
  }
  
  // Création de l'élément DOM conteneur
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = config.theme.event;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  // Mise à jour du DOM
  updateDOM(): boolean {
    return false;
  }

  // Définit l'expression mathématique
  setExpression(expression: string): void {
    const writable = this.getWritable();
    writable.__expression = expression;
  }

  getExpression(): string {
    return this.__expression;
  }

  // Rendu du composant React
  decorate(): JSX.Element {
    return (
      <EventComponent
        expression={this.__expression}
        nodeKey={this.__key}
      />
    );
  }
  
  // Sérialisation pour l'export JSON
  exportJSON(): SerializedEventNode {
    return {
      expression: this.__expression,
      type: 'event',
      version: 1,
    };
  }

  // Désérialisation depuis JSON
  static importJSON(serializedNode: SerializedEventNode): EventNode {
    return $createEventNode(serializedNode.expression);
  }

  // Conversion depuis le DOM (pour le copier-coller)
  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-event')) {
          return null;
        }
        return {
          conversion: convertEventElement,
          priority: 1,
        };
      },
    };
  }

  // Export vers le DOM (pour le copier-coller)
  exportDOM(): { element: HTMLElement } {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-event', 'true');
    element.textContent = this.__expression;
    return { element };
  }
}

// Fonction utilitaire pour créer un nœud d'équation
export function $createEventNode(expression = ''): EventNode {
  return new EventNode(expression);
}

// Vérifie si un nœud est un nœud d'équation
export function $isEventNode(
  node: LexicalNode | null | undefined,
): node is EventNode {
  return node instanceof EventNode;
}

// Fonction de conversion pour l'importation DOM
function convertEventElement(domNode: HTMLElement): DOMConversionOutput {
  const expression = domNode.textContent || '';
  const node = $createEventNode(expression);
  return { node };
}

// Déclaration du module pour les types de thème
declare module 'lexical' {
  interface LexicalTheme {
    event?: string;
  }
}