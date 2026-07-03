export interface CliArgs {
  root: string;
  includeDirs: string[];
  excludeDirs: string[];
  fileExtensions: string[];
  maxDepth?: number;
  printTree: boolean;
  treeFiles: boolean;
  printLoc: boolean;
  locPerFile: boolean;
  includeFileContent?: string[];
  outputFormat: 'text' | 'xml';
  outputFile?: string;
  _: string[];
  $0: string;
}

export interface FileSystemNode {
  id: number;
  name: string;
  path: string; // Full absolute path
  relativePath: string; // Path relative to the scanning root
  isDirectory: boolean;
  children: FileSystemNode[];
  depth: number;
  loc?: number; // Optional: lines of code for this file/directory
}
