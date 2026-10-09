import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { beforeAll, describe, expect, test } from 'vitest';

import { runScript } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('repo-stats integration tests', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const testConfigPath = path.resolve(__dirname, 'test-config.json');

  // Add a beforeAll to verify fixture directories exist
  beforeAll(() => {
    // Verify fixtures directory exists
    expect(fs.existsSync(fixturesDir)).toBe(true);
    // Verify test config exists
    expect(fs.existsSync(testConfigPath)).toBe(true);
  });

  test('should analyze simple repository structure', async () => {
    const repositoryPath = path.join(fixturesDir, 'simple-repository');

    const output = await runScript(['--config', testConfigPath, '--root', repositoryPath]);

    // Check that the output contains expected files
    expect(output).toContain('file1.ts');
    expect(output).toContain('file2.ts');

    // Check that LOC is calculated
    expect(output).toMatch(/=== TOTAL LOC: \d+ ===/);

    // Check that tree structure is included
    expect(output).toContain('src');
    expect(output).toContain('subdir');
  });

  test('should respect exclude patterns', async () => {
    const repositoryPath = path.join(fixturesDir, 'repository-with-excludes');

    const output = await runScript([
      '--config',
      testConfigPath,
      '--root',
      repositoryPath,
      '--include-dirs',
      '.',
    ]);

    // Check that node_modules content is not included
    expect(output).not.toContain('ignored.ts');
  });

  test('should handle SCSS files', async () => {
    const repositoryPath = path.join(fixturesDir, 'repository-with-scss');

    const output = await runScript([
      '--config',
      testConfigPath,
      '--root',
      repositoryPath,
      '--include-dirs',
      '.',
      '--file-extensions',
      'scss',
    ]);

    // Check that SCSS file is included
    expect(output).toContain('style.scss');

    // Check that LOC is calculated for SCSS
    expect(output).toMatch(/=== TOTAL LOC: \d+ ===/);
  });

  test('should output XML format', async () => {
    const repositoryPath = path.join(fixturesDir, 'simple-repository');

    const output = await runScript([
      '--config',
      testConfigPath,
      '--root',
      repositoryPath,
      '--output-format',
      'xml',
      '--include-file-content',
      '**/*.ts',
    ]);

    // Check XML structure
    expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(output).toContain(
      '<?xml-stylesheet type="text/xsl" href="schemas/repository/v1/repository.xsl"?>'
    );
    expect(output).toContain(
      '<spl:repository xmlns:spl="https://stillpointlab.com/schemas/repository/v1">'
    );
    expect(output).toContain('<spl:fileContents>');
    expect(output).toMatch(/<spl:fileContent spl:id="\d+" spl:path="src\/file1\.ts">/);
    expect(output).toContain('</spl:fileContent>');
    expect(output).toContain('</spl:fileContents>');
    expect(output).toContain('</spl:repository>');
  });

  test('should include file content when requested', async () => {
    const repositoryPath = path.join(fixturesDir, 'simple-repository');

    const output = await runScript([
      '--config',
      testConfigPath,
      '--root',
      repositoryPath,
      '--include-file-content',
      '**/*.ts',
    ]);

    // Check that file content is included
    expect(output).toContain('function calculateSum');
    expect(output).toContain('interface User');
  });

  test('should handle max depth limit', async () => {
    const repositoryPath = path.join(fixturesDir, 'simple-repository');

    const output = await runScript([
      '--config',
      testConfigPath,
      '--root',
      repositoryPath,
      '--max-depth',
      '1',
    ]);

    // Check that only files at depth 1 are included
    expect(output).toContain('file1.ts');
    expect(output).not.toContain('file2.ts');
  });
});
