import { promises as fs } from 'fs';
import path from 'path';

import { CliArgs, FileSystemNode } from './types.js';

/**
 * Checks if a line of text, after comments are stripped, constitutes actual code.
 * Excludes:
 * - Empty lines
 * - Lines that only contain grouping characters
 *
 * @param codeCandidate - The processed line content (comments theoretically stripped)
 * @returns boolean - True if it's a line of code, false otherwise.
 */
function isActualCodeLine(codeCandidate: string): boolean {
  const trimmedLine = codeCandidate.trim();
  if (trimmedLine === '') {
    return false;
  }
  const groupingChars = new Set(['[', ']', '{', '}', '(', ')', ';', ',']);
  const onlyGroupingChars = [...trimmedLine].every((char) => groupingChars.has(char));
  if (onlyGroupingChars) {
    return false;
  }
  return true;
}

/**
 * Counts the number of relevant lines of code in a file.
 * Handles:
 * - Single-line comments (//)
 * - Multi-line comments (/* ... * /)
 * - Empty lines
 * - Lines with only grouping characters
 *
 * Does NOT handle comment markers within string literals.
 *
 * @param filePath - Path to the file to analyze
 * @returns Promise<number> - Number of relevant lines of code
 * @throws Error if file cannot be read
 */
export async function countLoc(filePath: string): Promise<number> {
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read file for LOC count ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }

  const lines = content.split('\n');
  let locCount = 0;
  let inMultiLineComment = false;

  for (const line of lines) {
    let currentSegment = line;
    let effectiveCodeOnLine = ''; // Accumulates parts of the current line that are code

    while (currentSegment.length > 0) {
      if (inMultiLineComment) {
        const endCommentIndex = currentSegment.indexOf('*/');
        if (endCommentIndex !== -1) {
          // Multi-line comment ends on this line segment
          inMultiLineComment = false;
          currentSegment = currentSegment.substring(endCommentIndex + 2);
        } else {
          // The rest of this line is still within a multi-line comment
          currentSegment = ''; // Consumed the rest of the line
        }
      } else {
        // Not currently in a multi-line comment
        const multiLineStartIndex = currentSegment.indexOf('/*');
        const singleLineStartIndex = currentSegment.indexOf('//');

        if (
          multiLineStartIndex !== -1 &&
          (singleLineStartIndex === -1 || multiLineStartIndex < singleLineStartIndex)
        ) {
          // A multi-line comment starts here
          effectiveCodeOnLine += currentSegment.substring(0, multiLineStartIndex);
          inMultiLineComment = true;
          currentSegment = currentSegment.substring(multiLineStartIndex + 2);

          // Check if the multi-line comment also *ends* on this same segment
          // This handles cases like: code /* comment */ code
          const endCommentIndexOnSameSegment = currentSegment.indexOf('*/');
          if (endCommentIndexOnSameSegment !== -1) {
            inMultiLineComment = false;
            // Add any code after the comment to effectiveCodeOnLine
            effectiveCodeOnLine += currentSegment.substring(endCommentIndexOnSameSegment + 2);
            currentSegment = '';
          } else {
            // Comment spans to next line or consumes rest of this line
            currentSegment = '';
          }
        } else if (singleLineStartIndex !== -1) {
          // A single-line comment starts here (and it's before any potential /* or there's no /*)
          effectiveCodeOnLine += currentSegment.substring(0, singleLineStartIndex);
          currentSegment = ''; // Rest of the line is comment
        } else {
          // No comment start found in this segment, so it's all potential code
          effectiveCodeOnLine += currentSegment;
          currentSegment = '';
        }
      }
    }

    if (isActualCodeLine(effectiveCodeOnLine)) {
      locCount++;
    }
  }
  return locCount;
}

/**
 * Calculates and aggregates lines of code (LOC) for files and directories in the file system tree.
 * Performs a post-order traversal to ensure directory LOC is calculated after its children.
 *
 * @param node - The current node or array of nodes in the file system tree
 * @param args - Command line arguments containing configuration options
 * @returns Promise<void> - Modifies the tree in place by adding loc properties
 */
export async function calculateLoc(
  node: FileSystemNode | FileSystemNode[],
  args: CliArgs
): Promise<void> {
  if (Array.isArray(node)) {
    // Handle array of nodes
    for (const singleNode of node) {
      await calculateLoc(singleNode, args);
    }
    return;
  }

  // Process children first (post-order traversal)
  for (const child of node.children) {
    await calculateLoc(child, args);
  }

  if (node.isDirectory) {
    // For directories, sum up LOC from all children
    node.loc = node.children.reduce((sum, child) => sum + (child.loc || 0), 0);
  } else {
    // For files, check if extension matches and calculate LOC
    const ext = path.extname(node.name).toLowerCase().replace('.', '');
    if (args.fileExtensions.includes(ext)) {
      try {
        // Store LOC if locPerFile is true or if needed for directory aggregation
        if (args.locPerFile || args.printLoc) {
          const fileLoc = await countLoc(node.path);
          node.loc = fileLoc;
        }
      } catch (error) {
        console.error(`Error calculating LOC for ${node.path}:`, error);
        node.loc = 0;
      }
    }
  }
}

/**
 * Calculates a breakdown of lines of code and file counts by file extension.
 * Only includes files that have been processed for LOC counting.
 *
 * @param node - The root node or array of nodes of the file system tree
 * @returns { locBreakdown: Record<string, number>, fileCounts: Record<string, number> } - Map of file extensions to their total LOC and file counts
 */
export function calculateLocBreakdown(node: FileSystemNode | FileSystemNode[]): {
  locBreakdown: Record<string, number>;
  fileCounts: Record<string, number>;
} {
  const locBreakdown: Record<string, number> = {};
  const fileCounts: Record<string, number> = {};

  // Helper function to process a node and its children
  function processNode(currentNode: FileSystemNode) {
    if (!currentNode.isDirectory) {
      const ext = path.extname(currentNode.name).toLowerCase();
      if (currentNode.loc !== undefined) {
        locBreakdown[ext] = (locBreakdown[ext] || 0) + currentNode.loc;
        fileCounts[ext] = (fileCounts[ext] || 0) + 1;
      }
    }

    // Process all children
    for (const child of currentNode.children) {
      processNode(child);
    }
  }

  if (Array.isArray(node)) {
    // Handle array of nodes
    for (const singleNode of node) {
      processNode(singleNode);
    }
  } else {
    // Handle single node
    processNode(node);
  }

  return { locBreakdown, fileCounts };
}
