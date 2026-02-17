import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, $isRootNode, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { createCommand } from 'lexical';
import { $createInvokerNode } from '../../nodes/InvokerNode';

export const INSERT_INVOKER_COMMAND = createCommand('INSERT_INVOKER_COMMAND');

export default function InvokerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_INVOKER_COMMAND,
      () => {
        editor.update(async ()  => {
        // Récupérer dynamiquement la fonction de création du nœud
        
          const invokerNode = $createInvokerNode('');
          $insertNodes([invokerNode]);
          
          if ($isRootNode(invokerNode.getParent())) {
            invokerNode.selectNext();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}