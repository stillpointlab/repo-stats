import { describe, expect, test } from 'vitest';

import { buildTree } from './treeBuilder.js';
import { FileSystemNode } from './types.js';

describe('buildTree', () => {
  // Helper function to create a FileSystemNode
  const createNode = (
    id: number,
    name: string,
    path: string,
    isDirectory: boolean,
    depth: number
  ): FileSystemNode => ({
    id,
    name,
    path,
    relativePath: path,
    isDirectory,
    children: [],
    depth,
  });

  test('should return null for empty input list', () => {
    const result = buildTree([]);
    expect(result).toBeNull();
  });

  test('should handle single root node', () => {
    const rootNode = createNode(1, 'root', '/root', true, 0);
    const result = buildTree([rootNode]);

    expect(result).toEqual(rootNode);
    expect((result as FileSystemNode).children).toHaveLength(0);
  });

  test('should build simple hierarchy (root -> child)', () => {
    const rootNode = createNode(1, 'root', '/root', true, 0);
    const childNode = createNode(2, 'child.txt', '/root/child.txt', false, 1);

    const result = buildTree([rootNode, childNode]);

    expect(result).toEqual(rootNode);
    expect((result as FileSystemNode).children).toHaveLength(1);
    expect((result as FileSystemNode).children[0]).toEqual(childNode);
  });

  test('should build complex hierarchy (multiple levels, multiple children)', () => {
    const rootNode = createNode(1, 'root', '/root', true, 0);
    const dir1 = createNode(2, 'dir1', '/root/dir1', true, 1);
    const dir2 = createNode(3, 'dir2', '/root/dir2', true, 1);
    const file1 = createNode(4, 'file1.txt', '/root/file1.txt', false, 1);
    const file2 = createNode(5, 'file2.txt', '/root/dir1/file2.txt', false, 2);
    const file3 = createNode(6, 'file3.txt', '/root/dir2/file3.txt', false, 2);

    const result = buildTree([rootNode, dir1, dir2, file1, file2, file3]);

    expect(result).toEqual(rootNode);
    expect((result as FileSystemNode).children).toHaveLength(3); // dir1, dir2, file1
    expect((result as FileSystemNode).children[0].children).toHaveLength(1); // dir1 has file2
    expect((result as FileSystemNode).children[1].children).toHaveLength(1); // dir2 has file3
    expect((result as FileSystemNode).children[2].children).toHaveLength(0); // file1 has no children
  });

  test('should handle unordered input nodes', () => {
    const rootNode = createNode(1, 'root', '/root', true, 0);
    const file2 = createNode(5, 'file2.txt', '/root/dir1/file2.txt', false, 2);
    const dir1 = createNode(2, 'dir1', '/root/dir1', true, 1);

    const result = buildTree([file2, rootNode, dir1]);

    expect(result).toEqual(rootNode);
    expect((result as FileSystemNode).children).toHaveLength(1); // dir1
    expect((result as FileSystemNode).children[0].id).toEqual(dir1.id);
    expect((result as FileSystemNode).children[0].children).toHaveLength(1); // file2
    expect((result as FileSystemNode).children[0].children[0].id).toEqual(file2.id);
  });

  test('should handle edge case where file node has path suggesting parent relationship', () => {
    const rootNode = createNode(1, 'root', '/root', true, 0);
    const fileNode = createNode(2, 'file.txt', '/root/file.txt', false, 1);
    const childNode = createNode(3, 'child.txt', '/root/file.txt/child.txt', false, 2);

    const result = buildTree([rootNode, fileNode, childNode]);

    // The child node should not be added to fileNode's children since fileNode is not a directory
    expect(result).toEqual(rootNode);
    expect((result as FileSystemNode).children).toHaveLength(1); // Only fileNode
    expect((result as FileSystemNode).children[0].children).toHaveLength(0); // fileNode should have no children
  });

  test.runIf(process.platform === 'win32')('should handle Windows-style paths', () => {
    const rootNode = createNode(1, 'root', 'C:\\root', true, 0);
    const childNode = createNode(2, 'child.txt', 'C:\\root\\child.txt', false, 1);

    const result = buildTree([rootNode, childNode]);

    expect(result).toEqual(rootNode);
    expect((result as FileSystemNode).children).toHaveLength(1);
    expect((result as FileSystemNode).children[0]).toEqual(childNode);
  });

  test('should handle multiple root nodes', () => {
    const root1 = createNode(1, 'root1', '/root1', true, 0);
    const root2 = createNode(2, 'root2', '/root2', true, 0);
    const child1 = createNode(3, 'child1.txt', '/root1/child1.txt', false, 1);
    const child2 = createNode(4, 'child2.txt', '/root2/child2.txt', false, 1);

    const result = buildTree([root1, root2, child1, child2]);

    expect(Array.isArray(result)).toBe(true);
    expect((result as FileSystemNode[]).length).toBe(2);
    expect((result as FileSystemNode[])[0]).toEqual(root1);
    expect((result as FileSystemNode[])[1]).toEqual(root2);
    expect((result as FileSystemNode[])[0].children).toHaveLength(1);
    expect((result as FileSystemNode[])[1].children).toHaveLength(1);
    expect((result as FileSystemNode[])[0].children[0]).toEqual(child1);
    expect((result as FileSystemNode[])[1].children[0]).toEqual(child2);
  });
});
