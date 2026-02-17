import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { createCommand } from 'lexical';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import { $createMathExpNode, $isMathExpNode } from '../../nodes/MathNode/MathExpNode';
import { $createNodeContainer, nodeContainer} from '../../nodes/nodeContainer';

export const INSERT_MATH_COMMAND = createCommand('INSERT_MATH_COMMAND');

export default function MathPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    //effacer les 2 nodes ensemble au moment de suppression du parent node
    return mergeRegister(
      editor.registerNodeTransform(nodeContainer, (node) => {
        const children = node.getChildren();
        if (!children || !$isMathExpNode(children[0])) {
          node.remove();
        }
      }),

      editor.registerCommand(
      INSERT_MATH_COMMAND,
      () => {
        editor.update(() => {
            const mathExpNode = $createMathExpNode();
            const mathNodeContainer = $createNodeContainer();
            mathNodeContainer.append(mathExpNode);
            
            // Remplacer la sélection actuelle par notre nœud
            $insertNodeToNearestRoot(mathNodeContainer);
            //mathExpNode.selectEnd();
        });
        return true; // Commande gérée
      },
      COMMAND_PRIORITY_EDITOR,
    ));
  }, [editor]);

  return null;
}