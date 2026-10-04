#!/usr/bin/env node

import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { glob } from 'glob';

import { parseArgs } from './cli.js';
import { Formatter, OutputData } from './formatters/base.js';
import { TextFormatter } from './formatters/textFormatter.js';
import { XmlFormatter } from './formatters/xmlFormatter.js';
import { calculateLoc, calculateLocBreakdown } from './loc.js';
import { buildTree } from './treeBuilder.js';
import { getFormattedFileContent, scanProject } from './walker.js';

const isCliEntrypoint = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

export async function runScript(argv: string[] = process.argv.slice(2)) {
  // Parse command line arguments
  const args = parseArgs(argv);

  // Scan project and build initial file system nodes
  const nodes = await scanProject(args);

  // Build tree structure
  const tree = buildTree(nodes);
  if (!tree) {
    throw new Error('No files found matching the specified criteria');
  }

  // Calculate LOC if requested
  if (args.printLoc) {
    await calculateLoc(tree, args);
  }

  const totalLoc = Array.isArray(tree)
    ? tree.reduce((acc, node) => acc + (node.loc || 0), 0)
    : tree.loc;

  // Prepare output data
  const outputData: OutputData = {
    tree,
    args,
    totalLoc,
    filesCount: nodes.filter((node) => !node.isDirectory).length,
  };

  // Add LOC breakdown if LOC calculation was requested
  if (args.printLoc) {
    const breakdown = calculateLocBreakdown(tree);
    outputData.locBreakdown = breakdown;
  }

  // Handle file content inclusion if requested
  if (args.includeFileContent && args.includeFileContent.length > 0) {
    const fileContents = new Map<number, string[]>();
    const filePaths = new Map<number, string>();

    // Get all matching paths using glob
    const matchingPaths = await glob(args.includeFileContent, {
      cwd: path.resolve(args.root),
      dot: true,
      nodir: true,
      absolute: true,
    });

    for (const absolutePath of matchingPaths) {
      const targetNode = nodes.find((node) => node.path === absolutePath);

      if (targetNode && !targetNode.isDirectory) {
        const content = await getFormattedFileContent(targetNode);
        fileContents.set(targetNode.id, content);
        const posixPath = targetNode.relativePath.replace(/\\/g, '/');
        filePaths.set(targetNode.id, posixPath);
      }
    }

    outputData.fileContents = fileContents;
    outputData.filePaths = filePaths;
  }

  // Select and instantiate formatter
  const formatter: Formatter =
    args.outputFormat === 'xml' ? new XmlFormatter() : new TextFormatter();

  // Format and return output
  const output = formatter.format(outputData);

  if (args.outputFile) {
    console.log(`Writing output to ${args.outputFile}`);
    await fs.writeFile(args.outputFile, output, 'utf-8');
  } else {
    console.log(output);
  }

  return output;
}

async function main() {
  try {
    await runScript();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Execute main function if this file is run directly
if (isCliEntrypoint) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
