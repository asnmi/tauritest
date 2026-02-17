// Dans MathComponent.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey} from 'lexical';
import { evaluate } from 'mathjs';
import { useMathVariables } from '../../context/MathVariablesContext';
import { $isMathExpNode } from './MathExpNode';

interface MathComponentProps {
  expression: string;
  nodeKey: string;
}

export default function MathComponent({ expression: initialExpression, nodeKey }: MathComponentProps) {
  const [editor] = useLexicalComposerContext();
  const [expression, setExpression] = useState(initialExpression);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { setVariable, getAllVariables, removeVariable } = useMathVariables();

  // Fonction pour extraire les variables d'une expression (ex: "a = 5" ou "b = a + 2")
  const extractVariables = useCallback((expr: string): { name: string; value: string } | null => {
    const match = expr.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=(.+)$/);
    if (!match) return null;
    
    const name = match[1].trim();
    const valueExpr = match[2].trim();
    return { name, value: valueExpr };
  }, []);

  // Fonction pour évaluer l'expression
  const evaluateExpression = useCallback((expr: string) => {
    if (!expr.trim()) {
      setResult('');
      setError(null);
      return;
    }

    try {
      // Vérifier si c'est une affectation de variable (ex: "a = 5")
      const varAssignment = extractVariables(expr);
      
      if (varAssignment) {
        // Évaluer la partie droite de l'affectation avec les variables existantes
        const scope = getAllVariables();
        const value = evaluate(varAssignment.value, scope);
        
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
          throw new Error('Valeur non valide pour une variable');
        }
        
        // Mettre à jour la variable dans le contexte
        setVariable(varAssignment.name, value);
        setResult(`${varAssignment.name} = ${value}`);
        setError(null);
      } else {
        // Évaluer une expression normale en utilisant les variables existantes
        const scope = getAllVariables();
        const evalResult = evaluate(expr, scope);
        
        if (typeof evalResult === 'number' && !isFinite(evalResult)) {
          throw new Error('Résultat non fini');
        }
        
        const resultStr = String(evalResult);
        setResult(`= ${resultStr}`);
        setError(null);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Erreur d\'évaluation';
      setResult('');
      setError(errorMsg);
    }
  }, [extractVariables, getAllVariables, setVariable]);

  // Mettre à jour l'évaluation quand l'expression change
  useEffect(() => {
    evaluateExpression(expression);
  }, [expression, evaluateExpression]);

  // Effet pour nettoyer la variable lors de la suppression du composant
  useEffect(() => {
    return () => {
      // Vérifier si c'est une affectation de variable
      const varAssignment = extractVariables(expression);
      if (varAssignment) {
        // Supprimer la variable du contexte
        removeVariable(varAssignment.name);
      }
    };
  }, [expression, removeVariable]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newExpression = e.target.value;
    setExpression(newExpression);
    
    // Mettre à jour le nœud de manière optimisée
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMathExpNode(node) && node.getExpression() !== newExpression) {
        node.setExpression(newExpression);
      }
    });
  }, [editor, nodeKey]);

  const handleEvaluate = () => {
    // Mettre à jour le nœud avec la nouvelle expression
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if($isMathExpNode(node)){
        node.setExpression(expression);
      }

    });
  };

  // gestion de undo redo
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isMathExpNode(node)) {
          const currentExpression = node.getExpression();
          if (currentExpression !== expression) {
            setExpression(currentExpression);
          }
        }
      });
    });
  }, [editor, nodeKey, expression]);

  const inputWidth = Math.max(expression.length * 0.7, 4) + 'ch';

  return (
    <div 
      style={{
        display: 'inline-flex',
        transition: 'all 0.2s ease',
        fontFamily: 'monospace',
        fontSize: '0.95em',
        position: 'relative',
        color: error ? '#ff6b6b' : '#333',
        boxSizing: 'content-box',
        width: '100%',
      }}
    >
      <input
        type="text"
        value={expression}
        onChange={handleChange}
        onBlur={() => {
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
          fontFamily: 'monospace',
          fontSize: '14m',
          minWidth: inputWidth,
          maxWidth: '100%',
          padding: '4px 0',
          margin: 0,
          color: error ? '#ff6b6b' : '#333',
          flexGrow: 1,
          height: '100%',
          boxSizing: 'border-box'
        }}
        placeholder="Expression..."
      />
      {result && !error && (
        <span style={{ 
          marginLeft: '8px', 
          color: '#666',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '200px'
        }}>
          {result}
        </span>
      )}
      {error && (
        <span style={{ 
          marginLeft: '8px', 
          color: '#ff6b6b',
          fontSize: '0.85em',
          whiteSpace: 'nowrap'
        }}>
          {error}
        </span>
      )}
    </div>
  );
}