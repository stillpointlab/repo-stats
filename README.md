# repo-stats

Repository structure and line-count reporting CLI.

`repo-stats` scans a repository, builds a directory tree, calculates lines of
code by extension, and can optionally include selected file contents in text or
XML output.

## Usage

```sh
npm install
npm run build
npm run dev -- --root ../context-manager
```

After building, the package exposes a `repo-stats` binary:

```sh
repo-stats --root . --include-dirs src,docs --file-extensions ts,md --output-format text
```

## Configuration

By default, the CLI looks for `repo-stats.config.json` in the current working
directory. A different config can be supplied with `--config`.

Example:

```json
{
  "includeDirs": "src,docs,config",
  "excludeDirs": "node_modules,.git,dist,build",
  "fileExtensions": "js,ts,json,md,sql",
  "printTree": true,
  "treeFiles": false,
  "locPerFile": true,
  "outputFormat": "text"
}
```

## Common Options

- `--root`: Root directory to analyze.
- `--include-dirs`: Comma-separated directories to include.
- `--exclude-dirs`: Comma-separated directories to exclude.
- `--file-extensions`: Comma-separated file extensions to count.
- `--max-depth`: Maximum directory depth.
- `--tree-files`: Include files in the printed tree.
- `--include-file-content`: Glob patterns for files to embed in output.
- `--output-format`: `text` or `xml`.
- `--output-file`: Write output to a file instead of stdout.

## Development

```sh
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```
