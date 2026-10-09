import { promises as fs } from 'fs';
import path from 'path';

import { glob } from 'glob';

import { CliArgs, FileSystemNode } from './types.js';

let nextId = 1;

async function scanProject(args: CliArgs): Promise<FileSystemNode[]> {
  const nodes: FileSystemNode[] = [];
  const rootPath = path.resolve(args.root);

  // Build glob patterns for include/exclude
  const includePatterns = args.includeDirs.map((dir) => dir.replace(/\\/g, '/') + '/**/*');
  const excludePatterns = args.excludeDirs.map((dir) => dir.replace(/\\/g, '/') + '/**/*');

  // add the include dirs to the include patterns
  includePatterns.push(...args.includeDirs);
  excludePatterns.push(...args.excludeDirs);

  // Get all matching paths using glob
  const matchingPaths = await glob(includePatterns, {
    cwd: rootPath,
    dot: true,
    ignore: excludePatterns,
    absolute: true,
    maxDepth: args.maxDepth ? args.maxDepth + 1 : Infinity,
  });

  // Create a Set to store all paths we need to process (including parent directories)
  const pathsToProcess = new Set<string>();

  // Add all matching paths and their parent directories
  for (const absolutePath of matchingPaths) {
    let currentPath = absolutePath;
    let count = 0;
    const SAFE_MAX_DEPTH = 25;
    while (currentPath !== rootPath.replace(/\\/g, '/')) {
      pathsToProcess.add(currentPath);
      currentPath = path.dirname(currentPath);
      if (count++ > SAFE_MAX_DEPTH) {
        console.error(`Safe max depth reached for ${absolutePath}`);
        break;
      }
    }
  }

  // Process each path
  for (const absolutePath of pathsToProcess) {
    const stats = await fs.stat(absolutePath);
    const relativePath = path.relative(rootPath, absolutePath);
    const depth = relativePath.split(path.sep).length - 1;

    // Skip if we're at maxDepth and this is a directory
    if (
      args.maxDepth !== undefined &&
      (depth > args.maxDepth || (depth >= args.maxDepth && stats.isDirectory()))
    ) {
      continue;
    }

    const node: FileSystemNode = {
      id: nextId++,
      name: path.basename(absolutePath),
      path: absolutePath,
      relativePath,
      isDirectory: stats.isDirectory(),
      children: [],
      depth,
    };

    nodes.push(node);
  }

  return nodes;
}

async function getFormattedFileContent(node: FileSystemNode): Promise<string[]> {
  if (node.isDirectory) {
    return [];
  }

  const content = await fs.readFile(node.path, 'utf-8');
  return content.split('\n').map((line, index) => `${node.id}:${index}:${line}`);
}

export { getFormattedFileContent, scanProject };
