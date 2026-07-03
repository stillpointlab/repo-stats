import path from 'path';

import yargs from 'yargs';

import { CliArgs } from './types.js';

export function parseArgs(argv: string[] = process.argv.slice(2)): CliArgs {
  return yargs(argv)
    .pkgConf('repoStats')
    .option('config', {
      type: 'string',
      description: 'Path to a specific JSON configuration file.',
      default: path.resolve(process.cwd(), 'repo-stats.config.json'),
    })
    .config('config')
    .option('root', {
      type: 'string',
      default: process.cwd(),
      description: 'Root directory to analyze',
    })
    .option('include-dirs', {
      type: 'string',
      default: '.',
      description: 'Comma-separated list of directories to include',
      coerce: (value: string) => value.split(',').map((dir) => dir.trim()),
    })
    .option('exclude-dirs', {
      type: 'string',
      default: 'node_modules,.git,dist,build',
      description: 'Comma-separated list of directories to exclude',
      coerce: (value: string) => value.split(',').map((dir) => dir.trim()),
    })
    .option('file-extensions', {
      type: 'string',
      default: 'js,jsx,ts,tsx,json,md,sql',
      description: 'Comma-separated list of file extensions to analyze',
      coerce: (value: string) => value.split(',').map((ext) => ext.trim()),
    })
    .option('max-depth', {
      type: 'number',
      description: 'Maximum directory depth to traverse',
    })
    .option('print-tree', {
      type: 'boolean',
      default: true,
      description: 'Print directory tree structure',
    })
    .option('tree-files', {
      type: 'boolean',
      default: false,
      description: 'Include files in tree structure',
    })
    .option('print-loc', {
      type: 'boolean',
      default: true,
      description: 'Print lines of code statistics',
    })
    .option('loc-per-file', {
      type: 'boolean',
      default: false,
      description: 'Print lines of code per file',
    })
    .option('include-file-content', {
      type: 'string',
      description: 'Comma-separated list of glob patterns to include file content for',
      coerce: (value: string) => value.split(',').map((pattern) => pattern.trim()),
    })
    .option('output-format', {
      type: 'string',
      choices: ['text', 'xml'],
      default: 'text',
      description: 'Output format',
    })
    .option('output-file', {
      type: 'string',
      description: 'Write output to file instead of stdout',
    })
    .help()
    .version()
    .strict()
    .parseSync() as CliArgs;
}
