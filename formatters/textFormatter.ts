import { CliArgs, FileSystemNode } from '../types.js';

import { Formatter, OutputData } from './base.js';

function isLastNode(treeFiles: boolean, index: number, children: FileSystemNode[]): boolean {
  if (!treeFiles) {
    const lastDirectoryIndex = children.findLastIndex((child) => child.isDirectory);
    return index === lastDirectoryIndex;
  }
  return index === children.length - 1;
}

/**
 * Formats a file system node into an ASCII tree representation.
 * This is a shared utility function used by both text and XML formatters.
 */
function formatTree(
  node: FileSystemNode,
  prefix: string = '',
  isLast: boolean = true,
  args: CliArgs
): string {
  const connector = isLast ? '`-- ' : '|-- ';
  const childPrefix = isLast ? '    ' : '|   ';

  let output = `${prefix}${connector}${node.name}`;

  // Add node ID and LOC if available
  if (node.loc !== undefined) {
    output += ` [ID: ${node.id}, LOC: ${node.loc}]`;
  } else {
    output += ` [ID: ${node.id}]`;
  }
  output += '\n';

  // Process children
  if (node.children.length > 0) {
    node.children.forEach((child, index) => {
      if (child.isDirectory || args.treeFiles) {
        const lastNode = isLastNode(args.treeFiles, index, node.children);
        output += formatTree(child, prefix + childPrefix, lastNode, args);
      }
    });
  }

  return output;
}

export class TextFormatter implements Formatter {
  private formatLocBreakdown(
    locBreakdown: Record<string, number>,
    fileCounts: Record<string, number>
  ): string {
    let output = '=== LOC BREAKDOWN ===\n';
    Object.entries(locBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, loc]) => {
        const fileCount = fileCounts[ext] || 0;
        output += `${ext}: ${loc} lines (${fileCount} files)\n`;
      });
    return output;
  }

  private formatFileContents(
    fileContents: Map<number, string[]>,
    filePaths?: Map<number, string>
  ): string {
    let output = '=== FILE CONTENTS ===\n';
    fileContents.forEach((lines, id) => {
      const relativePath = filePaths?.get(id) || 'unknown path';
      output += `--- File ID: ${id} (${relativePath}) ---\n`;
      output += lines.join('\n') + '\n\n';
    });
    return output;
  }

  format(data: OutputData): string {
    let output = '';

    // Directory Tree Section
    if (data.args.printTree) {
      output += '=== DIRECTORY TREE ===\n';
      output += data.args.root + '\n';
      if (Array.isArray(data.tree)) {
        const treeArray = data.tree;
        treeArray.forEach((node, index) => {
          const lastNode = isLastNode(data.args.treeFiles, index, treeArray);
          output += formatTree(node, '', lastNode, data.args);
        });
      } else if (data.tree) {
        output += formatTree(data.tree, '', true, data.args);
      }
      output += '\n';
    }

    // LOC Summary Section
    if (data.args.printLoc) {
      if (data.totalLoc !== undefined) {
        output += `=== TOTAL LOC: ${data.totalLoc} ===\n`;
      }
      if (data.locBreakdown) {
        output += this.formatLocBreakdown(
          data.locBreakdown.locBreakdown,
          data.locBreakdown.fileCounts
        );
      }
      output += '\n';
    }

    // File Contents Section
    if (data.fileContents && data.fileContents.size > 0) {
      output += this.formatFileContents(data.fileContents, data.filePaths);
    }

    return output;
  }
}
