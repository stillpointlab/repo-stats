import { CliArgs, FileSystemNode } from '../types.js';

export interface OutputData {
  tree: FileSystemNode | FileSystemNode[] | null; // The root node(s) of the processed tree
  args: CliArgs;
  totalLoc?: number; // Overall total LOC
  filesCount: number;
  locBreakdown?: {
    locBreakdown: Record<string, number>;
    fileCounts: Record<string, number>;
  };
  fileContents?: Map<number, string[]>; // Map of file ID to its formatted lines
  filePaths?: Map<number, string>; // Map of file ID to its relative path
}

export interface Formatter {
  format(data: OutputData): string;
}
