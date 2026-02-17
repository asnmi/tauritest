/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import {DecoratorNode} from 'lexical';

export type SerializedEventNode = Spread<
  {
    time: string;
  },
  SerializedLexicalNode
>;

export class EventNode extends DecoratorNode<null> {
  __time: string;

  static getType(): string {
    return 'event';
  }

  static clone(node: EventNode): EventNode {
    return new EventNode(node.__time, node.__key);
  }

  static importJSON(serializedNode: SerializedEventNode): EventNode {
    return new EventNode(serializedNode.time);
  }

  constructor(time: string, key?: NodeKey) {
    super(key);
    this.__time = time;
  }

  exportJSON(): SerializedEventNode {
    return {
      ...super.exportJSON(),
      time: this.__time,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  setTime(time: string): void {
    const writable = this.getWritable();
    writable.__time = time;
  }

  getTime(): string {
    return this.__time;
  }

  decorate(): null {
    return null;
  }
}

export function $isEventNode(node: LexicalNode | null | undefined): node is EventNode {
  return node instanceof EventNode;
}

export function $createEventNode(time: string): EventNode {
  return new EventNode(time);
}
