import { beforeEach, describe, expect, test } from 'vitest';

import { FileSystemNode } from '../types.js';

import { OutputData } from './base.js';
import { TextFormatter } from './textFormatter.js';

describe('TextFormatter', () => {
  let formatter: TextFormatter;
  let mockOutputData: OutputData;

  beforeEach(() => {
    formatter = new TextFormatter();
    mockOutputData = {
      tree: null,
      args: {
        root: '/test',
        includeDirs: [],
        excludeDirs: [],
        fileExtensions: [],
        printTree: true,
        printLoc: true,
        treeFiles: true,
        locPerFile: false,
        outputFormat: 'text',
        _: [],
        $0: 'test',
      },
      filesCount: 0,
    };
  });

  describe('format', () => {
    test('should handle empty tree', () => {
      const result = formatter.format(mockOutputData);
      expect(result).toBe('=== DIRECTORY TREE ===\n/test\n\n\n');
    });

    test('should handle empty tree with printTree disabled', () => {
      mockOutputData.args.printTree = false;
      const result = formatter.format(mockOutputData);
      expect(result).toBe('\n');
    });

    test('should format simple tree structure', () => {
      const rootNode: FileSystemNode = {
        id: 1,
        name: 'root',
        path: '/root',
        relativePath: '/root',
        isDirectory: true,
        children: [
          {
            id: 2,
            name: 'file.txt',
            path: '/root/file.txt',
            relativePath: '/root/file.txt',
            isDirectory: false,
            children: [],
            depth: 1,
          },
        ],
        depth: 0,
      };

      mockOutputData.tree = rootNode;
      const result = formatter.format(mockOutputData);

      expect(result).toContain('=== DIRECTORY TREE ===');
      expect(result).toContain('/test');
      expect(result).toContain('`-- root [ID: 1]');
      expect(result).toContain('    `-- file.txt [ID: 2]');
    });

    test('should format LOC information', () => {
      mockOutputData.totalLoc = 100;
      mockOutputData.locBreakdown = {
        locBreakdown: {
          '.ts': 60,
          '.js': 40,
        },
        fileCounts: {
          '.ts': 2,
          '.js': 1,
        },
      };

      const result = formatter.format(mockOutputData);

      expect(result).toContain('=== TOTAL LOC: 100 ===');
      expect(result).toContain('=== LOC BREAKDOWN ===');
      expect(result).toContain('.ts: 60 lines (2 files)');
      expect(result).toContain('.js: 40 lines (1 files)');
    });

    test('should format file contents', () => {
      const fileContents = new Map<number, string[]>();
      fileContents.set(1, ['line1', 'line2']);
      const filePaths = new Map<number, string>();
      filePaths.set(1, '/test/file.txt');

      mockOutputData.fileContents = fileContents;
      mockOutputData.filePaths = filePaths;

      const result = formatter.format(mockOutputData);

      expect(result).toContain('=== FILE CONTENTS ===');
      expect(result).toContain('--- File ID: 1 (/test/file.txt) ---');
      expect(result).toContain('line1');
      expect(result).toContain('line2');
    });

    test('should respect printTree flag', () => {
      mockOutputData.args.printTree = false;
      const rootNode: FileSystemNode = {
        id: 1,
        name: 'root',
        path: '/root',
        relativePath: '/root',
        isDirectory: true,
        children: [],
        depth: 0,
      };
      mockOutputData.tree = rootNode;

      const result = formatter.format(mockOutputData);

      expect(result).not.toContain('=== DIRECTORY TREE ===');
    });

    test('should respect printLoc flag', () => {
      mockOutputData.args.printLoc = false;
      mockOutputData.totalLoc = 100;
      mockOutputData.locBreakdown = {
        locBreakdown: { '.ts': 100 },
        fileCounts: { '.ts': 1 },
      };

      const result = formatter.format(mockOutputData);

      expect(result).not.toContain('=== TOTAL LOC:');
      expect(result).not.toContain('=== LOC BREAKDOWN ===');
    });

    test('should handle multiple root nodes', () => {
      const rootNodes: FileSystemNode[] = [
        {
          id: 1,
          name: 'root1',
          path: '/root1',
          relativePath: '/root1',
          isDirectory: true,
          children: [],
          depth: 0,
        },
        {
          id: 2,
          name: 'root2',
          path: '/root2',
          relativePath: '/root2',
          isDirectory: true,
          children: [],
          depth: 0,
        },
      ];

      mockOutputData.tree = rootNodes;
      const result = formatter.format(mockOutputData);

      expect(result).toContain('|-- root1 [ID: 1]');
      expect(result).toContain('`-- root2 [ID: 2]');
    });
  });
});
