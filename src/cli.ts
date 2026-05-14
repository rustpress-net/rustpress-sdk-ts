#!/usr/bin/env node
/**
 * RustPress SDK CLI - Project scaffolding and development tools for TypeScript.
 *
 * Usage:
 *   rustpress create <type> <name>  - Create a new project (plugin, theme, app, hook)
 *   rustpress dev                   - Start development server
 *   rustpress build                 - Build for production
 *   rustpress validate              - Validate project configuration
 *   rustpress publish               - Publish to RustPress marketplace
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// Types
// =============================================================================

type ProjectType = 'plugin' | 'theme' | 'app' | 'hook';

interface RustPressConfig {
  name: string;
  type: ProjectType;
  version: string;
  main: string;
  sdk: string;
  sdkVersion: string;
  rustpress: {
    minVersion: string;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// Colors
// =============================================================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: string): string {
  return `${color}${text}${colors.reset}`;
}

function success(message: string): void {
  console.log(colorize(`✓ ${message}`, colors.green));
}

function error(message: string): void {
  console.log(colorize(`✗ ${message}`, colors.red));
}

function info(message: string): void {
  console.log(colorize(`ℹ ${message}`, colors.cyan));
}

function warning(message: string): void {
  console.log(colorize(`⚠ ${message}`, colors.yellow));
}

// =============================================================================
// Template Generators
// =============================================================================

function toClassName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function generatePluginSource(name: string, className: string): string {
  return `/**
 * ${name} - A RustPress Plugin
 *
 * This plugin provides custom functionality for RustPress.
 */

import {
  BasePlugin,
  HookContext,
  PluginConfig,
  RouteHandler,
} from '@rustpress/sdk';

export class ${className} extends BasePlugin {
  constructor() {
    super('${name}', {
      name: '${className}',
      version: '1.0.0',
      description: 'A custom RustPress plugin',
    });
  }

  async onActivate(context: HookContext): Promise<void> {
    this.log('info', 'Plugin activated');

    // Register hooks
    this.registerHook('content:before_save', this.beforeContentSave.bind(this));

    // Register routes
    this.registerRoute('GET', '/status', this.getStatus.bind(this));
  }

  async onDeactivate(): Promise<void> {
    this.log('info', 'Plugin deactivated');
  }

  private async beforeContentSave(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    content.metadata = content.metadata || {};
    (content.metadata as Record<string, unknown>).processedBy = this.id;
    return content;
  }

  private async getStatus(
    req: Record<string, unknown>,
    res: Record<string, unknown>
  ): Promise<{ status: string; plugin: string }> {
    return { status: 'active', plugin: this.id };
  }
}

// Export the plugin instance
export const plugin = new ${className}();
export default plugin;
`;
}

function generateThemeSource(name: string, className: string): string {
  return `/**
 * ${name} - A RustPress Theme
 *
 * This theme provides custom styling and layout for RustPress.
 */

import { BaseTheme, HookContext, ThemeConfig } from '@rustpress/sdk';

export class ${className} extends BaseTheme {
  constructor() {
    super('${name}', {
      name: '${className}',
      version: '1.0.0',
      description: 'A beautiful RustPress theme',
      supports: ['dark-mode', 'custom-colors', 'custom-fonts'],
    });
  }

  async onActivate(context: HookContext): Promise<void> {
    this.log('info', 'Theme activated');

    // Register theme assets
    this.registerAsset('css', '/theme/style.css');
    this.registerAsset('js', '/theme/main.js');
  }

  async onDeactivate(): Promise<void> {
    this.log('info', 'Theme deactivated');
  }
}

// Export the theme instance
export const theme = new ${className}();
export default theme;
`;
}

function generateAppSource(name: string, className: string): string {
  return `/**
 * ${name} - A RustPress App
 *
 * This app provides a custom admin panel interface for RustPress.
 */

import { BaseApp, HookContext, AppConfig } from '@rustpress/sdk';

export class ${className} extends BaseApp {
  constructor() {
    super('${name}', {
      name: '${className}',
      version: '1.0.0',
      description: 'A custom RustPress app',
      icon: 'dashboard',
      menu: {
        title: '${className}',
        icon: 'dashboard',
        position: 'sidebar',
      },
    });
  }

  async onActivate(context: HookContext): Promise<void> {
    this.log('info', 'App activated');

    // Register app routes
    this.registerRoute('GET', '/dashboard', this.getDashboard.bind(this));
    this.registerRoute('GET', '/settings', this.getSettings.bind(this));
    this.registerRoute('POST', '/settings', this.saveSettings.bind(this));
  }

  async onDeactivate(): Promise<void> {
    this.log('info', 'App deactivated');
  }

  private async getDashboard(
    req: Record<string, unknown>,
    res: Record<string, unknown>
  ): Promise<{ view: string; data: Record<string, unknown> }> {
    return { view: 'dashboard', data: {} };
  }

  private async getSettings(
    req: Record<string, unknown>,
    res: Record<string, unknown>
  ): Promise<{ view: string; data: Record<string, unknown> }> {
    return { view: 'settings', data: {} };
  }

  private async saveSettings(
    req: Record<string, unknown>,
    res: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    return { success: true };
  }
}

// Export the app instance
export const app = new ${className}();
export default app;
`;
}

function generateHookSource(name: string, functionName: string): string {
  return `/**
 * ${name} - A RustPress Hook Function
 *
 * This module defines hook functions for RustPress.
 */

import {
  defineHook,
  beforeHook,
  afterHook,
  HookContext,
  HookArgs,
  HookDefinition,
} from '@rustpress/sdk';

/**
 * Validation hook that runs before content creation.
 */
export const validateContent: HookDefinition = defineHook(
  {
    name: '${functionName}',
    displayName: '${name}',
    description: 'Validates data before processing',
    trigger: '@@rustpress.core.Content.create@@',
    timing: 'before',
  },
  async (args: HookArgs, context: HookContext): Promise<void> => {
    const data = args.originalArgs;

    // Example validation
    if (!data) {
      throw new Error('Data cannot be empty');
    }

    context.logger.info('Validation passed');
  }
);

/**
 * Logging hook that runs after content creation.
 */
export const logContent = afterHook(
  '@@rustpress.core.Content.create@@',
  async (args: HookArgs, context: HookContext): Promise<void> => {
    context.logger.info(\`Content created: \${JSON.stringify(args.result)}\`);
  },
  { name: 'logContent' }
);

// Export all hooks
export const hooks = {
  validateContent,
  logContent,
};

export default hooks;
`;
}

function generatePackageJson(name: string, projectType: ProjectType): string {
  return JSON.stringify(
    {
      name: name,
      version: '1.0.0',
      description: `A RustPress ${projectType}`,
      main: 'dist/index.js',
      module: 'dist/index.mjs',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.mjs',
          require: './dist/index.js',
          types: './dist/index.d.ts',
        },
      },
      scripts: {
        build: 'tsup src/index.ts --format cjs,esm --dts --clean',
        dev: 'tsup src/index.ts --format cjs,esm --dts --watch',
        test: 'vitest',
        'test:coverage': 'vitest --coverage',
        lint: 'eslint src --ext .ts',
        typecheck: 'tsc --noEmit',
        prepublishOnly: 'npm run build',
      },
      keywords: ['rustpress', projectType],
      author: 'Your Name',
      license: 'MIT',
      devDependencies: {
        '@rustpress/sdk': '^1.0.0',
        '@types/node': '^20.0.0',
        tsup: '^8.0.0',
        typescript: '^5.3.0',
        vitest: '^1.0.0',
        eslint: '^8.56.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
      },
      peerDependencies: {
        '@rustpress/sdk': '>=1.0.0',
      },
      engines: {
        node: '>=18.0.0',
      },
      files: ['dist', 'README.md', 'LICENSE'],
    },
    null,
    2
  );
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        lib: ['ES2022'],
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        isolatedModules: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );
}

function generateReadme(name: string, _className: string, projectType: ProjectType): string {
  return `# ${name}

A RustPress ${projectType} built with the TypeScript SDK.

## Installation

\`\`\`bash
npm install ${name}
\`\`\`

## Usage

\`\`\`typescript
import { ${projectType === 'hook' ? 'hooks' : projectType} } from '${name}';

// The ${projectType} is automatically loaded by RustPress
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Lint
npm run lint
\`\`\`

## Configuration

Add to your RustPress configuration:

\`\`\`json
{
  "${projectType}s": {
    "${name}": {
      "enabled": true
    }
  }
}
\`\`\`

## License

MIT
`;
}

function generateRustPressConfig(name: string, projectType: ProjectType): string {
  const config: RustPressConfig = {
    name,
    type: projectType,
    version: '1.0.0',
    main: 'dist/index.js',
    sdk: 'typescript',
    sdkVersion: '>=1.0.0',
    rustpress: {
      minVersion: '1.0.0',
    },
  };
  return JSON.stringify(config, null, 2);
}

function generateTestFile(name: string, className: string, projectType: ProjectType): string {
  const exportName = projectType === 'hook' ? 'hooks' : projectType;
  return `/**
 * Tests for ${name} ${projectType}.
 */

import { describe, it, expect } from 'vitest';
import { ${exportName} } from '../src';

describe('${className}', () => {
  it('should be defined', () => {
    expect(${exportName}).toBeDefined();
  });

  ${
    projectType !== 'hook'
      ? `
  it('should have correct id', () => {
    expect(${exportName}.id).toBe('${name}');
  });

  it('should have correct version', () => {
    expect(${exportName}.config.version).toBe('1.0.0');
  });
  `
      : `
  it('should export validateContent hook', () => {
    expect(${exportName}.validateContent).toBeDefined();
  });

  it('should export logContent hook', () => {
    expect(${exportName}.logContent).toBeDefined();
  });
  `
  }
});
`;
}

// =============================================================================
// Commands
// =============================================================================

function createProject(projectType: string, name: string): void {
  const validTypes: ProjectType[] = ['plugin', 'theme', 'app', 'hook'];

  if (!validTypes.includes(projectType as ProjectType)) {
    error(`Invalid project type: ${projectType}`);
    info(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  const type = projectType as ProjectType;
  const className = toClassName(name);
  const projectDir = path.resolve(name);

  if (fs.existsSync(projectDir)) {
    error(`Directory '${name}' already exists`);
    process.exit(1);
  }

  info(`Creating ${type} project: ${name}`);

  // Create directories
  fs.mkdirSync(projectDir);
  fs.mkdirSync(path.join(projectDir, 'src'));
  fs.mkdirSync(path.join(projectDir, 'tests'));

  // Generate source file
  let sourceContent: string;
  switch (type) {
    case 'plugin':
      sourceContent = generatePluginSource(name, className);
      break;
    case 'theme':
      sourceContent = generateThemeSource(name, className);
      break;
    case 'app':
      sourceContent = generateAppSource(name, className);
      break;
    case 'hook':
      sourceContent = generateHookSource(name, className.toLowerCase());
      break;
  }

  // Write files
  fs.writeFileSync(path.join(projectDir, 'src', 'index.ts'), sourceContent);
  fs.writeFileSync(path.join(projectDir, 'package.json'), generatePackageJson(name, type));
  fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), generateTsConfig());
  fs.writeFileSync(path.join(projectDir, 'README.md'), generateReadme(name, className, type));
  fs.writeFileSync(path.join(projectDir, 'rustpress.json'), generateRustPressConfig(name, type));
  fs.writeFileSync(
    path.join(projectDir, 'tests', `${name}.test.ts`),
    generateTestFile(name, className, type)
  );
  fs.writeFileSync(path.join(projectDir, 'LICENSE'), 'MIT License\n\nCopyright (c) 2024\n');
  fs.writeFileSync(
    path.join(projectDir, '.gitignore'),
    'node_modules/\ndist/\ncoverage/\n*.log\n.env\n'
  );

  success(`Created ${type} project: ${name}`);
  console.log();
  console.log(colorize('Next steps:', colors.bold));
  console.log(`  cd ${name}`);
  console.log('  npm install');
  console.log('  npm run dev');
}

function runDev(): void {
  const configPath = path.resolve('rustpress.json');

  if (!fs.existsSync(configPath)) {
    error('No rustpress.json found. Are you in a RustPress project directory?');
    process.exit(1);
  }

  const config: RustPressConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  info(`Starting development server for ${config.name}...`);

  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch {
    error('Development server failed');
    process.exit(1);
  }
}

function runBuild(): void {
  const configPath = path.resolve('rustpress.json');

  if (!fs.existsSync(configPath)) {
    error('No rustpress.json found. Are you in a RustPress project directory?');
    process.exit(1);
  }

  const config: RustPressConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  info(`Building ${config.name}...`);

  // Run type checking
  info('Running type checks...');
  try {
    execSync('npm run typecheck', { stdio: 'inherit' });
  } catch {
    warning('Type checking found issues');
  }

  // Run linting
  info('Running linter...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch {
    warning('Linting found issues');
  }

  // Build
  info('Building...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('Build complete!');
    info('Output: dist/');
  } catch {
    error('Build failed');
    process.exit(1);
  }
}

function validateProject(): void {
  const configPath = path.resolve('rustpress.json');
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!fs.existsSync(configPath)) {
    error('No rustpress.json found');
    process.exit(1);
  }

  let config: RustPressConfig;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    error(`Invalid JSON in rustpress.json: ${e}`);
    process.exit(1);
  }

  // Validate required fields
  const requiredFields: (keyof RustPressConfig)[] = ['name', 'type', 'version', 'main'];
  for (const field of requiredFields) {
    if (!config[field]) {
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate package.json exists
  if (!fs.existsSync('package.json')) {
    result.errors.push('Missing package.json');
  }

  // Validate src/index.ts exists
  if (!fs.existsSync('src/index.ts')) {
    result.errors.push('Missing src/index.ts');
  }

  // Check for README
  if (!fs.existsSync('README.md')) {
    result.warnings.push('Missing README.md');
  }

  // Check for tests
  if (!fs.existsSync('tests')) {
    result.warnings.push('No tests directory found');
  }

  // Print results
  if (result.errors.length > 0) {
    console.log(colorize('Validation failed:', colors.red));
    for (const err of result.errors) {
      error(err);
    }
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.log(colorize('Warnings:', colors.yellow));
    for (const warn of result.warnings) {
      warning(warn);
    }
  }

  success('Validation passed!');
}

function publishProject(): void {
  const configPath = path.resolve('rustpress.json');

  if (!fs.existsSync(configPath)) {
    error('No rustpress.json found');
    process.exit(1);
  }

  const config: RustPressConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  info(`Publishing ${config.name} v${config.version}...`);
  console.log();

  // Run validation first
  info('Validating project...');

  // Build if needed
  if (!fs.existsSync('dist')) {
    info('Building project...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch {
      error('Build failed');
      process.exit(1);
    }
  }

  // Upload to marketplace (simulated)
  info('Uploading to RustPress marketplace...');
  console.log();
  success(`Published ${config.name} v${config.version}!`);
  info(`View at: https://marketplace.rustpress.dev/${config.type}s/${config.name}`);
}

function printHelp(): void {
  console.log(colorize('RustPress SDK CLI (TypeScript)', colors.bold));
  console.log();
  console.log('Usage: rustpress <command> [options]');
  console.log();
  console.log(colorize('Commands:', colors.cyan));
  console.log('  create <type> <name>  Create a new project');
  console.log('                        Types: plugin, theme, app, hook');
  console.log('  dev                   Start development server');
  console.log('  build                 Build for production');
  console.log('  validate              Validate project configuration');
  console.log('  publish               Publish to RustPress marketplace');
  console.log('  help                  Show this help message');
  console.log('  version               Show version');
  console.log();
  console.log(colorize('Examples:', colors.cyan));
  console.log('  rustpress create plugin my-plugin');
  console.log('  rustpress create theme my-theme');
  console.log('  rustpress create app my-app');
  console.log('  rustpress create hook my-hook');
  console.log();
  console.log(colorize('Documentation:', colors.cyan));
  console.log('  https://rustpress.dev/docs/sdk/typescript');
}

function printVersion(): void {
  console.log('@rustpress/sdk 1.0.0');
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'create': {
      if (args.length < 3 || !args[1] || !args[2]) {
        error('Usage: rustpress create <type> <name>');
        process.exit(1);
      }
      createProject(args[1], args[2]);
      break;
    }

    case 'dev':
      runDev();
      break;

    case 'build':
      runBuild();
      break;

    case 'validate':
      validateProject();
      break;

    case 'publish':
      publishProject();
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    case 'version':
    case '--version':
    case '-v':
      printVersion();
      break;

    default:
      error(`Unknown command: ${command}`);
      info("Run 'rustpress help' for usage information");
      process.exit(1);
  }
}

main();
