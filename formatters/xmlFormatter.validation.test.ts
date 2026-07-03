import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import libxmljs from 'libxmljs2';
import { beforeEach, describe, expect, test } from 'vitest';

import { FileSystemNode } from '../types.js';

import { OutputData } from './base.js';
import { XmlFormatter } from './xmlFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('XmlFormatter XSD Validation', () => {
  let formatter: XmlFormatter;
  let mockOutputData: OutputData;
  let xsdSchema: libxmljs.Document;

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

    // Load the XSD schema
    const xsdPath = path.resolve(__dirname, '../schemas/repository/v1/repository.xsd');
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');
    xsdSchema = libxmljs.parseXml(xsdContent);
  });

  test('should produce valid XML according to XSD schema', () => {
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
          name: 'file.ts',
          path: '/root/file.ts',
          relativePath: '/root/file.ts',
          isDirectory: false,
          loc: 50,
          children: [],
          depth: 1,
        },
        {
          id: 3,
          name: 'subdir',
          path: '/root/subdir',
          relativePath: '/root/subdir',
          isDirectory: true,
          loc: 50,
          children: [
            {
              id: 4,
              name: 'nested.ts',
              path: '/root/subdir/nested.ts',
              relativePath: '/root/subdir/nested.ts',
              isDirectory: false,
              loc: 50,
              children: [],
              depth: 2,
            },
          ],
          depth: 1,
        },
      ],
      depth: 0,
    };

    mockOutputData.tree = rootNode;
    mockOutputData.totalLoc = 100;
    mockOutputData.locBreakdown = {
      locBreakdown: {
        '.ts': 100,
      },
      fileCounts: {
        '.ts': 2,
      },
    };

    const xmlOutput = formatter.format(mockOutputData);
    const xmlDoc = libxmljs.parseXml(xmlOutput);

    // Validate against XSD schema
    const isValid = xmlDoc.validate(xsdSchema);
    const validationErrors = xmlDoc.validationErrors;

    expect(isValid).toBe(true);
    expect(validationErrors).toHaveLength(0);
  });

  test('should produce valid XML with file contents', () => {
    const rootNode: FileSystemNode = {
      id: 1,
      name: 'src',
      path: '/project/src',
      relativePath: 'src',
      isDirectory: true,
      children: [
        {
          id: 2,
          name: 'index.ts',
          path: '/project/src/index.ts',
          relativePath: 'src/index.ts',
          isDirectory: false,
          loc: 10,
          children: [],
          depth: 1,
        },
      ],
      depth: 0,
    };

    const fileContents = new Map<number, string[]>();
    fileContents.set(2, [
      '// Main entry point',
      'export function main() {',
      '  console.log("Hello World");',
      '}',
    ]);

    const filePaths = new Map<number, string>();
    filePaths.set(2, 'src/index.ts');

    mockOutputData.tree = rootNode;
    mockOutputData.totalLoc = 10;
    mockOutputData.locBreakdown = {
      locBreakdown: { '.ts': 10 },
      fileCounts: { '.ts': 1 },
    };
    mockOutputData.fileContents = fileContents;
    mockOutputData.filePaths = filePaths;

    const xmlOutput = formatter.format(mockOutputData);
    const xmlDoc = libxmljs.parseXml(xmlOutput);

    // Validate against XSD schema
    const isValid = xmlDoc.validate(xsdSchema);
    const validationErrors = xmlDoc.validationErrors;

    expect(isValid).toBe(true);
    expect(validationErrors).toHaveLength(0);
  });

  test('should produce valid XML with all optional fields', () => {
    mockOutputData.args.maxDepth = 3;
    mockOutputData.args.includeFileContent = ['**/*.ts', '**/*.js'];
    mockOutputData.args.includeDirs = ['src', 'test'];
    mockOutputData.args.excludeDirs = ['node_modules', 'dist'];
    mockOutputData.args.fileExtensions = ['.ts', '.js', '.tsx'];

    const rootNodes: FileSystemNode[] = [
      {
        id: 1,
        name: 'src',
        path: '/project/src',
        relativePath: 'src',
        isDirectory: true,
        loc: 150,
        children: [],
        depth: 0,
      },
      {
        id: 2,
        name: 'test',
        path: '/project/test',
        relativePath: 'test',
        isDirectory: true,
        loc: 50,
        children: [],
        depth: 0,
      },
    ];

    mockOutputData.tree = rootNodes;
    mockOutputData.totalLoc = 200;
    mockOutputData.locBreakdown = {
      locBreakdown: {
        '.ts': 150,
        '.js': 50,
      },
      fileCounts: {
        '.ts': 10,
        '.js': 5,
      },
    };

    const xmlOutput = formatter.format(mockOutputData);
    const xmlDoc = libxmljs.parseXml(xmlOutput);

    // Validate against XSD schema
    const isValid = xmlDoc.validate(xsdSchema);
    const validationErrors = xmlDoc.validationErrors;

    if (!isValid) {
      console.error('Validation errors:', validationErrors);
    }

    expect(isValid).toBe(true);
    expect(validationErrors).toHaveLength(0);
  });

  test('should produce valid XML with minimal data', () => {
    // Test with minimal required data
    mockOutputData.args.printTree = false;
    mockOutputData.args.printLoc = false;

    const xmlOutput = formatter.format(mockOutputData);
    const xmlDoc = libxmljs.parseXml(xmlOutput);

    // Validate against XSD schema
    const isValid = xmlDoc.validate(xsdSchema);
    const validationErrors = xmlDoc.validationErrors;

    expect(isValid).toBe(true);
    expect(validationErrors).toHaveLength(0);
  });

  test('should handle special characters in XML content', () => {
    const rootNode: FileSystemNode = {
      id: 1,
      name: 'test & <special>',
      path: '/root/test & <special>',
      relativePath: 'test & <special>',
      isDirectory: true,
      children: [],
      depth: 0,
    };

    const fileContents = new Map<number, string[]>();
    fileContents.set(1, ['<xml>', '&entity;', '"quotes"', "'apostrophe'"]);

    const filePaths = new Map<number, string>();
    filePaths.set(1, 'test & <special>/file.xml');

    mockOutputData.tree = rootNode;
    mockOutputData.fileContents = fileContents;
    mockOutputData.filePaths = filePaths;

    const xmlOutput = formatter.format(mockOutputData);
    const xmlDoc = libxmljs.parseXml(xmlOutput);

    // Validate against XSD schema
    const isValid = xmlDoc.validate(xsdSchema);
    const validationErrors = xmlDoc.validationErrors;

    expect(isValid).toBe(true);
    expect(validationErrors).toHaveLength(0);

    // Verify special characters are properly escaped
    expect(xmlOutput).toContain('&amp;');
    expect(xmlOutput).toContain('&lt;');
    expect(xmlOutput).toContain('&gt;');
  });
});
