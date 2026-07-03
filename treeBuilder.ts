import path from 'path';

import { FileSystemNode } from './types.js';

/**
 * Builds a hierarchical tree structure from a flat list of FileSystemNode objects.
 * @param nodes Flat list of FileSystemNode objects
 * @returns The root node(s) of the tree with populated children arrays, or null if no nodes
 */
export function buildTree(nodes: FileSystemNode[]): FileSystemNode | FileSystemNode[] | null {
  if (nodes.length === 0) {
    return null;
  }

  // Create a map for quick node lookup by path
  const nodeMap = new Map<string, FileSystemNode>();

  // First pass: Add all nodes to the map
  for (const node of nodes) {
    nodeMap.set(node.path, node);
  }

  // Find all root nodes (nodes with minimum depth)
  const minDepth = Math.min(...nodes.map((node) => node.depth));
  const rootNodes = nodes.filter((node) => node.depth === minDepth);

  // If there's only one root node, return it directly
  if (rootNodes.length === 1) {
    const rootNode = rootNodes[0];

    // Second pass: Establish parent-child relationships
    for (const node of nodes) {
      if (node.path === rootNode.path) {
        continue; // Skip the root node
      }

      const parentPath = path.dirname(node.path);
      const parent = nodeMap.get(parentPath);

      // assert the parent node is a directory
      if (!parent || !parent.isDirectory) {
        console.error(`Parent node ${parentPath} for ${node.path} is not a directory`);
        continue;
      }

      parent.children.push(node);
    }

    return rootNode;
  }

  // Handle multiple root nodes
  for (const node of nodes) {
    if (rootNodes.some((root) => root.path === node.path)) {
      continue; // Skip root nodes
    }

    const parentPath = path.dirname(node.path);
    const parent = nodeMap.get(parentPath);

    // assert the parent node is a directory
    if (!parent || !parent.isDirectory) {
      console.error(`Parent node ${parentPath} for ${node.path} is not a directory`);
      continue;
    }

    parent.children.push(node);
  }

  return rootNodes;
}
