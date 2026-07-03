import { beforeEach, describe, expect, test } from 'vitest';

import { FileSystemNode } from '../types.js';

import { OutputData } from './base.js';
import { XmlFormatter } from './xmlFormatter.js';

describe('XmlFormatter', () => {
  let formatter: XmlFormatter;
  let mockOutputData: OutputData;

  beforeEach(() => {
    formatter = new XmlFormatter();
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
        outputFormat: 'xml',
        _: [],
        $0: 'test',
      },
      filesCount: 0,
    };
  });

  describe('format', () => {
    test('should handle empty tree', () => {
      const result = formatter.format(mockOutputData);
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain(
        '<?xml-stylesheet type="text/xsl" href="schemas/repository/v1/repository.xsl"?>'
      );
      expect(result).toContain(
        '<spl:repository xmlns:spl="https://stillpointlab.com/schemas/repository/v1">'
      );
      expect(result).toContain('</spl:repository>');
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

      expect(result).toContain('<spl:directoryTree>');
      expect(result).toContain(
        '<spl:node spl:type="directory" spl:id="1" spl:name="root" spl:path="/root" spl:relativePath="/root">'
      );
      expect(result).toContain(
        '<spl:node spl:type="file" spl:id="2" spl:name="file.txt" spl:path="/root/file.txt" spl:relativePath="/root/file.txt">'
      );
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

      expect(result).toContain('<spl:locSummary>');
      expect(result).toContain('<spl:totalLoc>100</spl:totalLoc>');
      expect(result).toContain('<spl:locBreakdown>');
      expect(result).toContain('<spl:extension spl:name=".ts" spl:lines="60" spl:files="2" />');
      expect(result).toContain('<spl:extension spl:name=".js" spl:lines="40" spl:files="1" />');
    });

    test('should format file contents with CDATA', () => {
      const fileContents = new Map<number, string[]>();
      fileContents.set(1, ['<xml>', '&special;', 'line2']);
      const filePaths = new Map<number, string>();
      filePaths.set(1, '/test/file.txt');

      mockOutputData.fileContents = fileContents;
      mockOutputData.filePaths = filePaths;

      const result = formatter.format(mockOutputData);

      expect(result).toContain('<spl:fileContents>');
      expect(result).toContain('<spl:fileContent spl:id="1" spl:path="/test/file.txt">');
      expect(result).toContain('<![CDATA[');
      expect(result).toContain('<xml>');
      expect(result).toContain('&special;');
      expect(result).toContain('line2');
      expect(result).toContain(']]>');
    });

    test('should escape XML special characters in metadata', () => {
      mockOutputData.args.root = '/test & path';
      mockOutputData.args.includeDirs = ['dir & subdir'];
      mockOutputData.args.excludeDirs = ['dir < subdir'];

      const result = formatter.format(mockOutputData);

      expect(result).toContain('<spl:root>/test &amp; path</spl:root>');
      expect(result).toContain('<spl:includeDirs>dir &amp; subdir</spl:includeDirs>');
      expect(result).toContain('<spl:excludeDirs>dir &lt; subdir</spl:excludeDirs>');
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

      expect(result).not.toContain('<spl:directoryTree>');
    });

    test('should respect printLoc flag', () => {
      mockOutputData.args.printLoc = false;
      mockOutputData.totalLoc = 100;
      mockOutputData.locBreakdown = {
        locBreakdown: { '.ts': 100 },
        fileCounts: { '.ts': 1 },
      };

      const result = formatter.format(mockOutputData);

      expect(result).not.toContain('<spl:locSummary>');
      expect(result).not.toContain('<spl:totalLoc>');
      expect(result).not.toContain('<spl:locBreakdown>');
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

      expect(result).toContain('<spl:directoryTree>');
      expect(result).toContain(
        '<spl:node spl:type="directory" spl:id="1" spl:name="root1" spl:path="/root1" spl:relativePath="/root1">'
      );
      expect(result).toContain(
        '<spl:node spl:type="directory" spl:id="2" spl:name="root2" spl:path="/root2" spl:relativePath="/root2">'
      );
    });

    test('should include LOC in node attributes when available', () => {
      const rootNode: FileSystemNode = {
        id: 1,
        name: 'root',
        path: '/root',
        relativePath: '/root',
        isDirectory: true,
        loc: 100,
        children: [
          {
            id: 2,
            name: 'file.txt',
            path: '/root/file.txt',
            relativePath: '/root/file.txt',
            isDirectory: false,
            loc: 50,
            children: [],
            depth: 1,
          },
        ],
        depth: 0,
      };

      mockOutputData.tree = rootNode;
      const result = formatter.format(mockOutputData);

      expect(result).toContain(
        '<spl:node spl:type="directory" spl:id="1" spl:name="root" spl:loc="100" spl:path="/root" spl:relativePath="/root">'
      );
      expect(result).toContain(
        '<spl:node spl:type="file" spl:id="2" spl:name="file.txt" spl:loc="50" spl:path="/root/file.txt" spl:relativePath="/root/file.txt">'
      );
    });
  });
});
