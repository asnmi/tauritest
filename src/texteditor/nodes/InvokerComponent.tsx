import React, { useState, useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getRoot } from 'lexical';
import { evaluate } from 'mathjs';
import { InvokerNode } from './InvokerNode';
import { $isMathExpNode } from './MathNode/MathExpNode';

interface InvokerComponentProps {
  expression: string;
  nodeKey: string;
}

export default function InvokerComponent({ expression: initialExpression, nodeKey }: InvokerComponentProps) {
  const [editor] = useLexicalComposerContext();
  const [expression, setExpression] = useState(initialExpression);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Fonction pour trouver un nœud par son ID ou sa position
  const findMathNode = useCallback((ref: string) => {
    return editor.getEditorState().read(() => {
      const root = $getRoot();
      const nodes = root.getChildren();
      
      // Si la référence est un nombre, on cherche par position (1-based)
      if (/^\d+$/.test(ref)) {
        const index = parseInt(ref, 10) - 1;
        if (index >= 0 && index < nodes.length) {
          const node = nodes[index];
          if ($isMathExpNode(node)) {
            return { 
              node, 
              value: node.getExpression(),
              key: node.getKey()
            };
          }
        }
      } 
      // Sinon on cherche par clé partielle
      else {
        const matchingNodes = [];
        
        // D'abord chercher une correspondance exacte
        for (const node of nodes) {
          if ($isMathExpNode(node)) {
            const nodeKey = node.getKey();
            if (nodeKey === ref) {
              return { 
                node, 
                value: node.getExpression(),
                key: nodeKey
              };
            }
            if (nodeKey.includes(ref)) {
              matchingNodes.push({
                node,
                value: node.getExpression(),
                key: nodeKey
              });
            }
          }
        }
        
        // Si on a une seule correspondance, la retourner
        if (matchingNodes.length === 1) {
          return matchingNodes[0];
        }
        
        // Si on a plusieurs correspondances, essayer de trouver la meilleure
        if (matchingNodes.length > 1) {
          // Essayer de trouver un nœud dont la clé commence par la référence
          const exactMatch = matchingNodes.find(n => n.key.startsWith(ref));
          if (exactMatch) return exactMatch;
          
          // Sinon retourner le premier
          return matchingNodes[0];
        }
      }
      
      return null;
    });
  }, [editor]);

  // Fonction pour évaluer l'expression avec support des références
  const evaluateExpression = useCallback((expr: string) => {
    if (!expr.trim()) {
      setResult('');
      setError(null);
      return;
    }

    try {
      // Remplacer les références $... par leurs valeurs
      let processedExpr = expr;
      const refMatches = expr.match(/\$(\w+)/g) || [];
      
      for (const match of refMatches) {
        const ref = match.substring(1); // Enlever le $
        const mathNode = findMathNode(ref);
        
        if (mathNode && mathNode.value) {
          try {
            // Évaluer l'expression du nœud référencé
            const nodeValue = evaluate(mathNode.value);
            processedExpr = processedExpr.replace(match, `(${nodeValue})`);
          } catch (e) {
            throw new Error(`Erreur dans le nœud ${ref}: ${e}`);
          }
        } else {
          throw new Error(`Nœud mathématique "${ref}" introuvable. Utilisez $1, $2, etc.`);
        }
      }

      // Évaluer l'expression finale
      const evalResult = evaluate(processedExpr);
      
      if (typeof evalResult === 'number' && !isFinite(evalResult)) {
        throw new Error('Résultat non fini');
      }
      
      setResult(`= ${evalResult}`);
      setError(null);
    } catch (e) {
      setResult('');
      setError(e instanceof Error ? e.message : 'Erreur d\'évaluation');
    }
  }, [findMathNode]);

  // Mettre à jour l'évaluation quand l'expression change
  useEffect(() => {
    evaluateExpression(expression);
  }, [expression, evaluateExpression]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newExpression = event.target.value;
    setExpression(newExpression);
  };

  const handleEvaluate = () => {
    // Mettre à jour le nœud avec la nouvelle expression
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as InvokerNode | null;
      if (node) {
        node.setExpression(expression);
      }
    });
  };

  const inputWidth = Math.max(expression.length * 0.7, 4) + 'ch';

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: isFocused ? '#f8f9fa' : '#f0f0f0',
        padding: '2px 8px',
        borderRadius: '4px',
        border: `1px solid ${error ? '#ff6b6b' : isFocused ? '#4dabf7' : '#dee2e6'}`,
        transition: 'all 0.2s ease',
        fontFamily: 'monospace',
        fontSize: '0.95em',
        verticalAlign: 'middle',
        margin: '0 2px',
        position: 'relative'
      }}
    >
      <input
        type="text"
        value={expression}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleEvaluate();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleEvaluate();
          }
        }}
        style={{
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          width: inputWidth,
          minWidth: '4ch',
          color: error ? '#ff6b6b' : 'inherit',
        }}
        placeholder="$ref ou expression"
      />
      {result && !error && (
        <span style={{ marginLeft: '8px', color: '#666' }}>
          {result}
        </span>
      )}
      {error && (
        <span style={{ marginLeft: '8px', color: '#ff6b6b' }}>
          {error}
        </span>
      )}
    </span>
  );
}