import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, $isRootNode, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { $createInvokerNode } from '../../nodes/InvokerNode';
import { createCommand } from 'lexical';

export const INSERT_INVOKER_COMMAND = createCommand('INSERT_INVOKER_COMMAND');

export default function InvokerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
        INSERT_INVOKER_COMMAND,
      () => {
        editor.update(() => {
          const invokerNode = $createInvokerNode('');
          $insertNodes([invokerNode]);
          
          // Optionnel: placer le curseur après le noeud
          if ($isRootNode(invokerNode.getParent())) {
             invokerNode.selectNext();
          }

        });
        return true; // Commande gérée
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}