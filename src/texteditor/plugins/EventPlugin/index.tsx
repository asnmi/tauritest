import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { createCommand } from 'lexical';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import { $createEventNodeContainer, eventNodeContainer } from '../../nodes/Event/EventNodeContainer';
import { $createEventNode, $isEventNode } from '@/texteditor/nodes/Event/EventNode';


export const INSERT_EVENT_COMMAND = createCommand('INSERT_EVENT_COMMAND');

export default function EventPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      //effacer les 2 nodes ensemble au moment de suppression du parent node
      editor.registerNodeTransform(eventNodeContainer, (node) => {
        const children = node.getChildren();
        if (!children || !$isEventNode(children[0])) {
          node.remove();
        }
      }),

      editor.registerCommand(
      INSERT_EVENT_COMMAND,
      () => {
        editor.update(() => {
            const eventNode = $createEventNode();
            const eventNodeContainer = $createEventNodeContainer();
            eventNodeContainer.append(eventNode);
            
            // Remplacer la sélection actuelle par notre nœud
            $insertNodeToNearestRoot(eventNodeContainer);
            //eventNode.selectEnd();
        });
        return true; // Commande gérée
      },
      COMMAND_PRIORITY_EDITOR,
    ));
  }, [editor]);

  return null;
}