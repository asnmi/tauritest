import { DecoratorNode, DOMConversionMap, DOMConversionOutput, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React,{JSX} from 'react';

// On importe le composant que nous avons créé
const MathComponent = React.lazy(() => import('./MathComponent'));

export type SerializedMathExpNode = Spread<
  {
    expression: string;
    type: 'mathexp';
    version: number;
  },
  SerializedLexicalNode
>;

export class MathExpNode extends DecoratorNode<JSX.Element> {
  __expression: string;

  static getType(): string {
    return 'mathexp';
  }

  static clone(node: MathExpNode): MathExpNode {
    return new MathExpNode(node.__expression, node.__key);
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
    const className = config.theme.math;
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
      <MathComponent
        expression={this.__expression}
        nodeKey={this.__key}
      />
    );
  }
  
  // Sérialisation pour l'export JSON
  exportJSON(): SerializedMathExpNode {
    return {
      expression: this.__expression,
      type: 'mathexp',
      version: 1,
    };
  }

  // Désérialisation depuis JSON
  static importJSON(serializedNode: SerializedMathExpNode): MathExpNode {
    return $createMathExpNode(serializedNode.expression);
  }

  // Conversion depuis le DOM (pour le copier-coller)
  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mathexp')) {
          return null;
        }
        return {
          conversion: convertMathExpElement,
          priority: 1,
        };
      },
    };
  }

  // Export vers le DOM (pour le copier-coller)
  exportDOM(): { element: HTMLElement } {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mathexp', 'true');
    element.textContent = this.__expression;
    return { element };
  }
}

// Fonction utilitaire pour créer un nœud d'équation
export function $createMathExpNode(expression = ''): MathExpNode {
  return new MathExpNode(expression);
}

// Vérifie si un nœud est un nœud d'équation
export function $isMathExpNode(
  node: LexicalNode | null | undefined,
): node is MathExpNode {
  return node instanceof MathExpNode;
}

// Fonction de conversion pour l'importation DOM
function convertMathExpElement(domNode: HTMLElement): DOMConversionOutput {
  const expression = domNode.textContent || '';
  const node = $createMathExpNode(expression);
  return { node };
}

// Déclaration du module pour les types de thème
declare module 'lexical' {
  interface LexicalTheme {
    mathexp?: string;
  }
}