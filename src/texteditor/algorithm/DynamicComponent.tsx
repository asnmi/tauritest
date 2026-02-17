import { createElement, ReactNode } from 'react';
import _ from 'lodash';
import React from 'react';

interface DNode {
  tagName: string;
  properties?: Record<string, any>;
  children?: Array<DNode | string>;
  textNode?: string;
}

export function createComponent(
  dNode: DNode | DNode[] | string | undefined | null,
  h: typeof createElement
): ReactNode | ReactNode[] {
  // Handle null, undefined, or empty node
  if (!dNode) {
    return null;
  }

  // Handle string nodes
  if (typeof dNode === 'string') {
    return dNode;
  }

  // Handle array of nodes
  if (Array.isArray(dNode)) {
    return dNode.map((child, index) => {
      const component = createComponent(child, h);
      return React.isValidElement(component) && !component.key
        ? React.cloneElement(component, { key: `node-${index}` })
        : component;
    });
  }

  // Validate node structure
  if (!dNode.tagName) {
    console.warn('Invalid node: missing tagName', dNode);
    return null;
  }

  // Process children
  const children: ReactNode[] = [];
  if (dNode.children?.length) {
    dNode.children.forEach((child, index) => {
      index;
      const childComponent = createComponent(child, h);
      if (childComponent !== null) {
        children.push(childComponent);
      }
    });
  }

  // Clone properties to avoid mutation
  const properties = dNode.properties ? { ...dNode.properties } : {};
  
  // Add unique key if not provided
  if (!properties.key) {
    properties.key = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Return the created element
  return h(
    dNode.tagName,
    properties,
    children.length > 0 ? children : dNode.textNode
  );
}