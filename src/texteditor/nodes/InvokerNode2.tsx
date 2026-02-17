import { DecoratorNode, DOMConversionMap, DOMConversionOutput, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React from 'react';
import {JSX} from 'react';

// On importe le composant que nous avons créé
const InvokerComponent = React.lazy(() => import('./InvokerComponent'));

export type SerializedInvokerNode = Spread<
  {
    expression: string;
    type: 'invoker';
    version: 1;
  },
  SerializedLexicalNode
>;

export class InvokerNode extends DecoratorNode<JSX.Element> {
  __expression: string;

  static getType(): string {
    return 'invoker';
  }

  static clone(node: InvokerNode): InvokerNode {
    return new InvokerNode(node.__expression, node.__key);
  }

  constructor(expression = '', key?: NodeKey) {
    super(key);
    this.__expression = expression;
  }
  
  // Création de l'élément DOM conteneur
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = config.theme.math;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  // Mise à jour du DOM
  updateDOM(): boolean {
    return false; // La mise à jour est gérée par React
  }

  // Définit l'expression mathématique
  setExpression(expression: string): void {
    const writable = this.getWritable();
    writable.__expression = expression;
  }

  // Rendu du composant React
  decorate(): JSX.Element {
    return (
      <React.Suspense fallback={null}>
        <InvokerComponent
          expression={this.__expression}
          nodeKey={this.__key}
        />
      </React.Suspense>
    );
  }
  
  // Sérialisation pour l'export JSON
  exportJSON(): SerializedInvokerNode {
    return {
      expression: this.__expression,
      type: 'invoker',
      version: 1,
    };
  }

  // Désérialisation depuis JSON
  static importJSON(serializedNode: SerializedInvokerNode): InvokerNode {
    return $createInvokerNode(serializedNode.expression);
  }

  // Conversion depuis le DOM (pour le copier-coller)
  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-invoker')) {
          return null;
        }
        return {
          conversion: convertInvokerElement,
          priority: 1,
        };
      },
    };
  }

  // Export vers le DOM (pour le copier-coller)
  exportDOM(): { element: HTMLElement } {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-invoker', 'true');
    element.textContent = this.__expression;
    return { element };
  }
}

// Fonction utilitaire pour créer un nœud d'équation
export function $createInvokerNode(expression = ''): InvokerNode {
  return new InvokerNode(expression);
}

// Vérifie si un nœud est un nœud d'équation
export function $isInvokerNode(
  node: LexicalNode | null | undefined,
): node is InvokerNode {
  return node instanceof InvokerNode;
}

// Fonction de conversion pour l'importation DOM
function convertInvokerElement(domNode: HTMLElement): DOMConversionOutput {
  const expression = domNode.textContent || '';
  const node = $createInvokerNode(expression);
  return { node };
}

// Déclaration du module pour les types de thème
declare module 'lexical' {
  interface LexicalTheme {
    invoker?: string;
  }
}