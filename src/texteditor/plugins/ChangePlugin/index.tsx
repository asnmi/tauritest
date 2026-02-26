/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * dirtyARMBlocks and dirtyUpdateBlocs are used to track the changes in the document
 * but they are not optimized, because lexical undo redo does not detect
 * dirty node efficiently after undo redo operations
 */

import type { EditorState, LexicalNode, SerializedLexicalNode } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  HISTORY_MERGE_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import useLayoutEffect from "./useLayoutEffect";
import {
  useGlobalContext,
  BlocChangesType,
} from "@/texteditor/context/GlobalContext";
import { generateKeyBetween } from "@/texteditor/algorithm/fractional_indexing";
import {
  BlocJson,
  newBloc,
  updateBlocPosition,
  deleteBloc,
  updateBlocContent,
  ERROR,
  NO_CHANGE
} from "@/texteditor/database/useBlocDatabase";
import { useNavigation } from "@/texteditor/context/NavigationContext";
import { useEffect, useRef } from "react";
import {
  setPositionState,
  setIdState,
  getPositionState,
} from "@/texteditor/DocumentState/DocumentStateManager";
import { logger } from "@/logger/logger";

export const BLOC_ACTIONS = {
  ADD: "add_bloc",
  REMOVE: "remove_bloc",
  UPDATE: "update_bloc",
  MOVE: "move_bloc",
} as const;

export function ChangePlugin({
  ignoreHistoryMergeTagChange = true,
  ignoreSelectionChange = false,
  onChange,
}: {
  ignoreHistoryMergeTagChange?: boolean;
  ignoreSelectionChange?: boolean;
  onChange?: (editorState: EditorState) => void;
}): null {
  const [editor] = useLexicalComposerContext();
  const { setModified, documentIsModified } = useGlobalContext();
  const { getCurrentItemFromHistory } = useNavigation();
  const changesRef = useRef<BlocChangesType | null>(null);
  let isModifiedRef = useRef<boolean>(false);
  let modifiedNodes = useRef<Set<BlocChangesType>>(new Set());

  isModifiedRef.current = documentIsModified();

  // ARM = add, remove, move
  let {
    dirtyARMBlocs,
    dirtyUpdateBlocs,
    keyIdPositionList,
    setKeyIdPositionList,
  } = useGlobalContext();

  // Add this inside the ChangePlugin component, after the existing useEffect hooks
  useEffect(() => {
    const interval = setInterval(() => {
      if (modifiedNodes.current.size > 0) {
        try {
          updateBlocManager(editor._editorState);
          modifiedNodes.current.clear();
        } catch (error) {
          console.error("Error updating bloc manager:", error);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [modifiedNodes.current]);

  useEffect(() => {
    const handleUndoRedo = (type: "undo" | "redo") => {
      const action = type === "undo" ? "UNDO" : "REDO";

      const prevEditorState = editor.getEditorState();
      const dirtyElements = new Map<string, boolean>();
      const dirtyLeaves = new Set<string>();

      // Remplir les éléments modifiés
      dirtyARMBlocs.forEach((value: BlocChangesType) => {
        dirtyElements.set(value.key, true);
      });

      // Remplir les feuilles modifiées
      dirtyUpdateBlocs.forEach((value: BlocChangesType) => {
        dirtyLeaves.add(value.key);
      });

      // Détecter les changements après un court délai
      requestAnimationFrame(() => {
        const editorState = editor.getEditorState();
        try {
          detectChange(
            editorState,
            prevEditorState,
            dirtyElements,
            dirtyLeaves,
            setModified,
          );
        } catch (error) {
          logger.error(`Error during ${action}:`, error);
        }
      });

      return false;
    };

    // Enregistrer les commandes
    const unregisterUndo = editor.registerCommand(
      UNDO_COMMAND,
      () => handleUndoRedo("undo"),
      COMMAND_PRIORITY_EDITOR,
    );

    const unregisterRedo = editor.registerCommand(
      REDO_COMMAND,
      () => handleUndoRedo("redo"),
      COMMAND_PRIORITY_EDITOR,
    );

    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  useLayoutEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState, tags }) => {
        if (
          (ignoreSelectionChange &&
            dirtyElements.size === 0 &&
            dirtyLeaves.size === 0) ||
          (ignoreHistoryMergeTagChange && tags.has(HISTORY_MERGE_TAG)) ||
          prevEditorState.isEmpty()
        ) {
          return;
        }

        detectChange(
          editorState,
          prevEditorState,
          dirtyElements,
          dirtyLeaves,
          setModified,
        );

        if (onChange) {
          onChange(editorState);
        }
      },
    );
  }, [editor, ignoreHistoryMergeTagChange, ignoreSelectionChange, onChange]);

  function getContent(
    node: LexicalNode,
    editorState: EditorState,
  ): SerializedLexicalNode {
    const nodeNum = node.getIndexWithinParent();
    return editorState.toJSON().root.children[nodeNum];
  }

  function setARMChanges(ret: BlocChangesType) {
    let len = dirtyARMBlocs.length;
    let ok = false;
    ret = { id: ret.id, key: ret.key, type: ret.type };

    if (len === 0) {
      ok = true;
    }
    if (len > 0) {
      for (let i = len - 1; i >= 0; i--) {
        let changes = dirtyARMBlocs[i];
        if (changes.id === ret.id) {
          dirtyARMBlocs.splice(i, 1);
          ok = true;
          break;
        } else {
          ok = true;
        }
      }
    }
    if (ok) {
      dirtyARMBlocs.push(ret);
    }
  }

  function detectChange(
    editorState: EditorState,
    prevEditorState: EditorState,
    dirtyElements: Map<string, boolean>,
    dirtyLeaves: Set<string>,
    setModified: (state: BlocChangesType) => void,
  ) {
    dirtyLeaves.forEach((nodeKey) => {
      let ret = { type: "", key: "", id: "" };
      editorState.read(() => {
        const node = editorState._nodeMap.get(nodeKey);
        if (node) {
          let tempNode = node.getParent();
          let parentNode;
          if (tempNode?.__key === "root") {
            parentNode = node;
          } else {
            parentNode = tempNode;
          }
          if (parentNode) {
            let id = keyIdPositionList.get(parentNode.__key)?.id;
            if (id) {
              ret = {
                type: BLOC_ACTIONS.UPDATE,
                key: parentNode.__key,
                id: id,
              };
            }
            setModified(ret);
          }
        }
      });

      if (ret.id.length > 0) {
        let existedNode = false;
        if (modifiedNodes.current.size > 0) {
          for (const node of modifiedNodes.current) {
            if (node.key === ret.key && node.type === ret.type) {
              existedNode = true;
              break;
            }
          }
        }
        if (!existedNode && ret.id.length > 0) {
          modifiedNodes.current.add(ret);
        }

        let len = dirtyUpdateBlocs.length;
        let ok = false;

        if (len === 0) {
          ok = true;
        }
        if (len > 0) {
          for (let i = len - 1; i >= 0; i--) {
            let changes = dirtyUpdateBlocs[i];
            if (ret.id.length > 0 && changes.id === ret.id) {
              dirtyUpdateBlocs.splice(i, 1);
              ok = true;
              break;
            } else {
              ok = true;
            }
          }
        }

        if (ok) {
          dirtyUpdateBlocs.push(ret);
        }
      }
    });

    dirtyElements.forEach((isDirty, nodeKey) => {
      isDirty;
      const nodeExists = editorState._nodeMap.has(nodeKey);
      const nodeExisted = prevEditorState._nodeMap.has(nodeKey);

      if (nodeExists && !nodeExisted) {
        let id = crypto.randomUUID();
        let ret = { type: BLOC_ACTIONS.ADD, key: nodeKey, id: id };
        setModified(ret);
        setARMChanges(ret);
        addBlocManager(ret, editorState);
      } else if (!nodeExists && nodeExisted) {
        let id = "";
        let ok = false;
        prevEditorState.read(() => {
          const prevNode = prevEditorState._nodeMap.get(nodeKey);
          if (prevNode) {
            id = keyIdPositionList.get(prevNode.__key)?.id || "";
            ok = true;
          }
        });

        if (ok && id.length > 0) {
          let ret = { type: BLOC_ACTIONS.REMOVE, key: nodeKey, id: id };
          setModified(ret);
          setARMChanges(ret);
          deleteBlocManager(id);
          console.log("remove", ret);
        } else {
          logger.error("not enough infos to remove bloc", nodeKey);
        }
      } else if (nodeExists && nodeExisted) {
        let prevPrevSiblingKey: string | null = null;
        let prevNextSiblingKey: string | null = null;
        let ok = false;
        const prevNode = prevEditorState._nodeMap.get(nodeKey);
        if (prevNode) {
          prevEditorState.read(() => {
            const prevSibling = prevNode.getPreviousSibling();
            const nextSibling = prevNode.getNextSibling();
            if (prevSibling) {
              prevPrevSiblingKey = prevSibling.__key;
            }
            if (nextSibling) {
              prevNextSiblingKey = nextSibling.__key;
            }
          });
        }

        let id = "";
        let currentPrevSiblingKey: string | null = null;
        let currentNextSiblingKey: string | null = null;
        editorState.read(() => {
          const currentNode = editorState._nodeMap.get(nodeKey);
          if (currentNode) {
            const currentPrevSibling = currentNode.getPreviousSibling();
            const currentNextSibling = currentNode.getNextSibling();

            if (currentPrevSibling) {
              currentPrevSiblingKey = currentPrevSibling.__key;
            }
            if (currentNextSibling) {
              currentNextSiblingKey = currentNextSibling.__key;
            }

            id = keyIdPositionList.get(currentNode.__key)?.id || "";
            ok = true;
          }
        });
        if (ok) {
          if (
            prevPrevSiblingKey !== currentPrevSiblingKey &&
            prevNextSiblingKey !== currentNextSiblingKey
          ) {
            let ret = { type: BLOC_ACTIONS.MOVE, key: nodeKey, id: id };
            setModified(ret);
            setARMChanges(ret);
            moveBlocManager(ret, editorState);
            console.log("move", ret);
          }
        } else {
          logger.error("not enough infos to move bloc");
        }
      }
    });
  }

  function generateIndex(
    node: LexicalNode | null,
    editorState: EditorState,
  ): string {
    if (!node) return generateKeyBetween(null, null);

    const prevNode = node.getPreviousSibling();
    const nextNode = node.getNextSibling();

    const prevPosition = prevNode
      ? getPositionState(getContent(prevNode, editorState))
      : null;
    const nextPosition = nextNode
      ? getPositionState(getContent(nextNode, editorState))
      : null;

    return generateKeyBetween(prevPosition, nextPosition);
  }

  async function addBlocManager(
    changes: BlocChangesType,
    editorState: EditorState,
  ) {
    logger.log("adding bloc");
    let newItem: BlocJson = {
      id: "",
      position: "",
      content: "",
      page_id: "",
      bloc_type: "",
      created_at: 0,
      updated_at: 0,
    };
    let ok = false;
    if (changes.type === BLOC_ACTIONS.ADD) {
      //can't create bloc asynchronously
      await new Promise<void>((resolve) => {
        editor.update(() => {
          let node = editorState._nodeMap.get(changes.key);

          if (node) {
            changesRef.current = changes;

            if (changesRef.current) {
              const content = getContent(node, editorState);
              const newIndex = generateIndex(node, editorState);

              if (content) {
                setPositionState(content, newIndex);
                setIdState(content, changes.id);

                keyIdPositionList.set(changes.key, {
                  id: changes.id,
                  position: newIndex,
                });
                setKeyIdPositionList(keyIdPositionList);

                newItem = {
                  id: changesRef.current.id,
                  position: newIndex,
                  content: JSON.stringify(content),
                  page_id: getCurrentItemFromHistory().id,
                  bloc_type: node.__type,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                };
                ok = true;
              }
            }
          }
          resolve();
        });
      });
      if (ok) {
        let res = await newBloc(newItem);
        setModified({ key: "", type: "", id: "" });
        if (res.length <= 0) {
          logger.error("add bloc failed", changes.id);
        }
      } else {
        logger.error("add bloc failed, newItem not defined");
      }
    }
  }

  async function moveBlocManager(
    changes: BlocChangesType,
    editorState: EditorState,
  ) {
    let node = editorState._nodeMap.get(changes.key);
    if (node) {
      let newIndex = "aa";
      let ok = false;
      await new Promise<void>((resolve) => {
        editor.update(() => {
          newIndex = generateIndex(node, editorState);

          // TODO: is this useful?
          keyIdPositionList.delete(changes.key);
          keyIdPositionList.set(changes.key, {
            id: changes.id,
            position: newIndex,
          });
          setKeyIdPositionList(keyIdPositionList);

          ok = true;
          resolve();
        });
      });
      if (ok) {
        let res = await updateBlocPosition(changes.id, newIndex, Date.now());
        setModified({ key: "", type: "", id: "" });
        if (res === ERROR) {
          logger.error("move block failed", changes.id);
        } else if (res === NO_CHANGE) {
          logger.log("move block no change", changes.id);
        }
      } else {
        logger.error("move block failed, id and Index not defined");
      }
    }
  }

  async function deleteBlocManager(id: string) {
    let res = await deleteBloc(id);

    keyIdPositionList.delete(id);
    setKeyIdPositionList(keyIdPositionList);

    setModified({ key: "", type: "", id: "" });
    if (res === false) {
      logger.error("NO block deleted", id);
    }
  }

  async function updateBlocManager(editorState: EditorState) {
    if (modifiedNodes.current.size > 0) {
      editorState.read(() => {
        modifiedNodes.current.forEach(async (changes) => {
          if (changes.type === BLOC_ACTIONS.UPDATE) {
            const node = editorState._nodeMap.get(changes.key);
            if (node) {
              const content = getContent(node, editorState);

              setPositionState(content, keyIdPositionList.get(changes.key)?.position||'');
              setIdState(content, changes.id);
              let id = changes.id;

              if (id.length > 0 && id !== "") {
                let res = await updateBlocContent(
                  id,
                  JSON.stringify(content),
                  Date.now(),
                );
                console.log("update bloc content", changes);
                setModified({ key: "", type: "", id: "" });
                if (res === ERROR) {
                  logger.error("save last updated block failed", id);
                } else if (res === NO_CHANGE) {
                  logger.log("save last updated block no change", id);
                }
              }
            }
          }
        });
      });
    }
  }

  return null;
}
