import { promises as fs } from 'fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateLoc, calculateLocBreakdown, countLoc } from './loc.js';
import { CliArgs, FileSystemNode } from './types.js';

// Mock fs.readFile
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

describe('countLoc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 for an empty file', async () => {
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue('');
    expect(await countLoc('empty.txt')).toBe(0);
  });

  it('should count only actual code lines', async () => {
    const content = `
      const x = 1;
      const y = 2;
      function add(a, b) {
        return a + b;
      }
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('code.txt')).toBe(4);
  });

  it('should ignore single-line comments', async () => {
    const content = `
      // This is a comment
      const x = 1; // Inline comment
      // Another comment
      const y = 2;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('single-line-comments.txt')).toBe(2);
  });

  it('should ignore multi-line comments', async () => {
    const content = `
      /* This is a
         multi-line comment */
      const x = 1;
      /* Another comment */
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('multi-line-comments.txt')).toBe(1);
  });

  it('should handle multi-line comments spanning multiple lines', async () => {
    const content = `
      const x = 1;
      /* This is a
         multi-line comment
         spanning multiple lines */
      const y = 2;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('multi-line-span.txt')).toBe(2);
  });

  it('should handle multi-line comments on a single line', async () => {
    const content = `
      const x = 1; /* inline multi-line comment */ const y = 2;
      const z = 3;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('inline-multi-line.txt')).toBe(2);
  });

  it('should handle multi-line comments without code on the line', async () => {
    const content = `
      /* comment */
      const x = 1;
      /* another comment */
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('multi-line-no-code.txt')).toBe(1);
  });

  it('should handle mixed code and comments', async () => {
    const content = `
      // Single line comment
      const x = 1;
      /* Multi-line
         comment */
      const y = 2; // Inline comment
      /* Comment */ const z = 3;
      const a = 4; /* Comment */ const b = 5;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('mixed.txt')).toBe(4);
  });

  it('should ignore empty lines', async () => {
    const content = `
      const x = 1;

      const y = 2;

      const z = 3;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('empty-lines.txt')).toBe(3);
  });

  it('should ignore lines with only grouping characters', async () => {
    const content = `
      function example() {
        const obj = {
          arr: [
            (1 + 2)
          ]
        };
      }
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('grouping-chars.txt')).toBe(4);
  });

  it('should handle tricky comment cases', async () => {
    const content = `
      // /* still a single line comment */
      /* // still a multi-line comment */
      const x = 1;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    expect(await countLoc('tricky-comments.txt')).toBe(1);
  });

  it('should handle comment markers within string literals (current behavior)', async () => {
    const content = `
      const str1 = "// This is not a comment";
      const str2 = "/* This is not a comment */";
      const x = 1;
    `;
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    // Note: Current implementation doesn't handle string literals specially
    expect(await countLoc('string-literals.txt')).toBe(3);
  });

  it('should throw an error when file cannot be read', async () => {
    (fs.readFile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('File not found'));
    await expect(countLoc('nonexistent.txt')).rejects.toThrow('Failed to read file for LOC count');
  });
});

describe('calculateLoc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle array of nodes', async () => {
    const mockNode1: FileSystemNode = {
      id: 1,
      name: 'file1.ts',
      path: '/path/to/file1.ts',
      relativePath: 'file1.ts',
      isDirectory: false,
      children: [],
      depth: 0,
    };

    const mockNode2: FileSystemNode = {
      id: 2,
      name: 'file2.ts',
      path: '/path/to/file2.ts',
      relativePath: 'file2.ts',
      isDirectory: false,
      children: [],
      depth: 0,
    };

    (fs.readFile as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('const x = 1;')
      .mockResolvedValueOnce('const y = 2;');

    const args: CliArgs = {
      root: '/path/to',
      fileExtensions: ['ts'],
      printLoc: true,
      locPerFile: true,
      includeDirs: [],
      excludeDirs: [],
      printTree: false,
      outputFormat: 'text',
      includeFileContent: [],
      treeFiles: false,
      _: [],
      $0: 'node',
    };

    await calculateLoc([mockNode1, mockNode2], args);

    expect(mockNode1.loc).toBe(1);
    expect(mockNode2.loc).toBe(1);
  });

  it('should handle nested directory structure with array input', async () => {
    const mockFile1: FileSystemNode = {
      id: 1,
      name: 'file1.ts',
      path: '/path/to/file1.ts',
      relativePath: 'file1.ts',
      isDirectory: false,
      children: [],
      depth: 1,
    };

    const mockDir: FileSystemNode = {
      id: 2,
      name: 'dir',
      path: '/path/to/dir',
      relativePath: 'dir',
      isDirectory: true,
      children: [mockFile1],
      depth: 0,
    };

    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue('const x = 1;');

    const args: CliArgs = {
      root: '/path/to',
      fileExtensions: ['ts'],
      printLoc: true,
      locPerFile: true,
      includeDirs: [],
      excludeDirs: [],
      printTree: false,
      outputFormat: 'text',
      includeFileContent: [],
      treeFiles: false,
      _: [],
      $0: 'node',
    };

    await calculateLoc([mockDir], args);

    expect(mockFile1.loc).toBe(1);
    expect(mockDir.loc).toBe(1);
  });
});

describe('calculateLocBreakdown', () => {
  it('should handle array of nodes', () => {
    const mockNode1: FileSystemNode = {
      id: 1,
      name: 'file1.ts',
      path: '/path/to/file1.ts',
      relativePath: 'file1.ts',
      isDirectory: false,
      children: [],
      loc: 10,
      depth: 0,
    };

    const mockNode2: FileSystemNode = {
      id: 2,
      name: 'file2.js',
      path: '/path/to/file2.js',
      relativePath: 'file2.js',
      isDirectory: false,
      children: [],
      loc: 20,
      depth: 0,
    };

    const breakdown = calculateLocBreakdown([mockNode1, mockNode2]);

    expect(breakdown).toEqual({
      locBreakdown: {
        '.ts': 10,
        '.js': 20,
      },
      fileCounts: {
        '.ts': 1,
        '.js': 1,
      },
    });
  });

  it('should handle nested directory structure with array input', () => {
    const mockFile1: FileSystemNode = {
      id: 1,
      name: 'file1.ts',
      path: '/path/to/file1.ts',
      relativePath: 'file1.ts',
      isDirectory: false,
      children: [],
      loc: 10,
      depth: 1,
    };

    const mockDir: FileSystemNode = {
      id: 2,
      name: 'dir',
      path: '/path/to/dir',
      relativePath: 'dir',
      isDirectory: true,
      children: [mockFile1],
      loc: 10,
      depth: 0,
    };

    const breakdown = calculateLocBreakdown([mockDir]);

    expect(breakdown).toEqual({
      locBreakdown: {
        '.ts': 10,
      },
      fileCounts: {
        '.ts': 1,
      },
    });
  });

  it('should handle multiple files of the same extension', () => {
    const mockFile1: FileSystemNode = {
      id: 1,
      name: 'file1.ts',
      path: '/path/to/file1.ts',
      relativePath: 'file1.ts',
      isDirectory: false,
      children: [],
      loc: 10,
      depth: 0,
    };

    const mockFile2: FileSystemNode = {
      id: 2,
      name: 'file2.ts',
      path: '/path/to/file2.ts',
      relativePath: 'file2.ts',
      isDirectory: false,
      children: [],
      loc: 15,
      depth: 0,
    };

    const breakdown = calculateLocBreakdown([mockFile1, mockFile2]);

    expect(breakdown).toEqual({
      locBreakdown: {
        '.ts': 25,
      },
      fileCounts: {
        '.ts': 2,
      },
    });
  });

  it('should handle files with no LOC', () => {
    const mockFile: FileSystemNode = {
      id: 1,
      name: 'file.ts',
      path: '/path/to/file.ts',
      relativePath: 'file.ts',
      isDirectory: false,
      children: [],
      loc: undefined,
      depth: 0,
    };

    const breakdown = calculateLocBreakdown([mockFile]);

    expect(breakdown).toEqual({
      locBreakdown: {},
      fileCounts: {},
    });
  });

  it('should handle empty array input', () => {
    const breakdown = calculateLocBreakdown([]);

    expect(breakdown).toEqual({
      locBreakdown: {},
      fileCounts: {},
    });
  });
});
