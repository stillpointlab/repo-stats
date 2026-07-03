import { CliArgs, FileSystemNode } from '../types.js';

import { Formatter, OutputData } from './base.js';

export class XmlFormatter implements Formatter {
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatLocBreakdown(
    locBreakdown: Record<string, number>,
    fileCounts: Record<string, number>
  ): string {
    let output = '<spl:locBreakdown>\n';
    Object.entries(locBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, loc]) => {
        const fileCount = fileCounts[ext] || 0;
        output += `  <spl:extension spl:name="${this.escapeXml(ext)}" spl:lines="${loc}" spl:files="${fileCount}" />\n`;
      });
    output += '</spl:locBreakdown>';
    return output;
  }

  private formatFileContents(
    fileContents: Map<number, string[]>,
    filePaths?: Map<number, string>
  ): string {
    let output = '<spl:fileContents>\n';
    fileContents.forEach((lines, id) => {
      const relativePath = filePaths?.get(id) || 'unknown path';
      output += `  <spl:fileContent spl:id="${id}" spl:path="${this.escapeXml(relativePath)}">\n`;
      output += '    <![CDATA[\n';
      output += lines.join('\n');
      output += '\n    ]]>\n';
      output += '  </spl:fileContent>\n';
    });
    output += '</spl:fileContents>';
    return output;
  }

  private formatTreeNode(node: FileSystemNode, args: CliArgs): string {
    const type = node.isDirectory ? 'directory' : 'file';
    const locAttr = node.loc !== undefined ? ` spl:loc="${node.loc}"` : '';
    const pathAttr = ` spl:path="${this.escapeXml(node.path)}"`;
    const relativePathAttr = ` spl:relativePath="${this.escapeXml(node.relativePath)}"`;

    let output = `<spl:node spl:type="${type}" spl:id="${node.id}" spl:name="${this.escapeXml(node.name)}"${locAttr}${pathAttr}${relativePathAttr}>`;

    if (node.children.length > 0) {
      output += '\n';
      node.children.forEach((child) => {
        if (child.isDirectory || args.treeFiles) {
          output += '  ' + this.formatTreeNode(child, args).replace(/\n/g, '\n  ') + '\n';
        }
      });
    }

    output += '</spl:node>';
    return output;
  }

  format(data: OutputData): string {
    let output = '<?xml version="1.0" encoding="UTF-8"?>\n';
    output +=
      '<?xml-stylesheet type="text/xsl" href="schemas/repository/v1/repository.xsl"?>\n';
    output += '<spl:repository xmlns:spl="https://stillpointlab.com/schemas/repository/v1">\n';

    // Metadata Section
    output += '  <spl:metadata>\n';
    output += `    <spl:root>${this.escapeXml(data.args.root)}</spl:root>\n`;
    output += `    <spl:includeDirs>${data.args.includeDirs.map((dir) => this.escapeXml(dir)).join(', ')}</spl:includeDirs>\n`;
    output += `    <spl:excludeDirs>${data.args.excludeDirs.map((dir) => this.escapeXml(dir)).join(', ')}</spl:excludeDirs>\n`;
    output += `    <spl:fileExtensions>${data.args.fileExtensions.join(', ')}</spl:fileExtensions>\n`;
    if (data.args.maxDepth !== undefined) {
      output += `    <spl:maxDepth>${data.args.maxDepth}</spl:maxDepth>\n`;
    }
    if (data.args.includeFileContent) {
      output += `    <spl:includeFileContent>${data.args.includeFileContent.join(', ')}</spl:includeFileContent>\n`;
    }
    output += '  </spl:metadata>\n';

    // Directory Tree Section
    if (data.args.printTree) {
      output += '  <spl:directoryTree>\n';
      if (Array.isArray(data.tree)) {
        data.tree.forEach((node) => {
          output += '    ' + this.formatTreeNode(node, data.args).replace(/\n/g, '\n    ') + '\n';
        });
      } else if (data.tree) {
        output +=
          '    ' + this.formatTreeNode(data.tree, data.args).replace(/\n/g, '\n    ') + '\n';
      }
      output += '  </spl:directoryTree>\n';
    }

    // LOC Summary Section
    if (data.args.printLoc) {
      output += '  <spl:locSummary>\n';
      if (data.totalLoc !== undefined) {
        output += `    <spl:totalLoc>${data.totalLoc}</spl:totalLoc>\n`;
      }
      if (data.locBreakdown) {
        output += `    ${this.formatLocBreakdown(data.locBreakdown.locBreakdown, data.locBreakdown.fileCounts)}\n`;
      }
      output += '  </spl:locSummary>\n';
    }

    // File Contents Section
    if (data.fileContents && data.fileContents.size > 0) {
      output += `  ${this.formatFileContents(data.fileContents, data.filePaths)}\n`;
    }

    output += '</spl:repository>';
    return output;
  }
}
