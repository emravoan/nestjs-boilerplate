#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

/**
 * Parses CLI flags into a simple key/value map.
 */
function parseFlags(argv) {
  const flags = {};

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, rawValue] = arg.slice(2).split('=');
    const key = rawKey.trim();

    if (!key) {
      continue;
    }

    if (rawValue === undefined) {
      flags[key] = true;
      continue;
    }

    flags[key] = rawValue;
  }

  return flags;
}

/**
 * Generates a cryptographically strong random hex secret.
 */
function generateSecret(byteLength = 32) {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Replaces KEY=value pairs while preserving line ordering.
 */
function replaceEnvValues(template, values) {
  const lines = template.split(/\r?\n/);

  return lines
    .map((line) => {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
      if (!match) {
        return line;
      }

      const key = match[1];
      if (!(key in values)) {
        return line;
      }

      return `${key}=${String(values[key])}`;
    })
    .join('\n');
}

/**
 * Replaces YAML "KEY: value" lines for docker compose sync.
 */
function replaceComposeValues(composeTemplate, values) {
  let content = composeTemplate;

  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`(^\\s*${key}:\\s*).*$`, 'm');
    content = content.replace(pattern, `$1${String(value)}`);
  }

  return content;
}

/**
 * Asks before overwrite unless --force/--yes are enabled.
 */
async function canWriteFile(targetPath, options, rl) {
  if (!existsSync(targetPath)) {
    return true;
  }

  if (options.force || options.yes) {
    return true;
  }

  const answer = await rl.question(`File "${targetPath}" already exists. Overwrite? (y/N): `);
  return /^(y|yes)$/i.test(answer.trim());
}

/**
 * Prints CLI usage and options.
 */
function printHelp() {
  console.log(`Usage: pnpm init:project [options]

Options:
  --yes                       Skip overwrite prompts
  --force                     Force overwrite existing files
  --dry-run                   Preview actions without writing files
  --app-name=<name>           APP_NAME value
  --port=<number>             APP port and compose app host port
  --db-name=<name>            DB_NAME and MYSQL_DATABASE
  --db-user=<name>            DB_USERNAME and MYSQL_USER
  --db-password=<password>    DB_PASSWORD and MYSQL_PASSWORD
  --db-root-password=<value>  MYSQL_ROOT_PASSWORD
  --cors-origins=<csv>        CORS_ORIGINS value
  --help                      Show this message
`);
}

/**
 * Initializes local project config files from examples.
 */
async function main() {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.help) {
    printHelp();
    return;
  }

  const cwd = process.cwd();
  const rl = createInterface({ input, output });

  try {
    const options = {
      yes: Boolean(flags.yes),
      force: Boolean(flags.force),
      dryRun: Boolean(flags['dry-run']),
    };

    const projectName = path.basename(cwd);
    const port = String(flags.port || 3000);
    const dbName = String(flags['db-name'] || 'nestjs_boilerplate');
    const dbUser = String(flags['db-user'] || 'app');
    const dbPassword = String(flags['db-password'] || 'app');
    const dbRootPassword = String(flags['db-root-password'] || generateSecret(20));

    const envExamplePath = path.join(cwd, '.env.example');
    const envOutputPath = path.join(cwd, '.env');
    const composeExamplePath = path.join(cwd, 'docker-compose.example.yml');
    const composeOutputPath = path.join(cwd, 'docker-compose.yml');

    /**
     * Ensures required template files exist before initialization.
     */
    if (!existsSync(envExamplePath)) {
      throw new Error('Missing ".env.example" template file.');
    }

    if (!existsSync(composeExamplePath)) {
      throw new Error('Missing "docker-compose.example.yml" template file.');
    }

    /**
     * Builds runtime .env values with generated security secrets.
     */
    const envValues = {
      APP_NAME: String(flags['app-name'] || projectName),
      NODE_ENV: 'development',
      PORT: port,
      API_PREFIX: 'api',
      API_VERSION: 'v1',
      API_KEY: generateSecret(32),
      JWT_SECRET: generateSecret(48),
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRES_IN: '7d',
      CSRF_SECRET: generateSecret(32),
      CORS_ORIGINS: String(flags['cors-origins'] || 'http://localhost:3000'),
      THROTTLE_TTL: '60000',
      THROTTLE_LIMIT: '60',
      DB_HOST: '127.0.0.1',
      DB_PORT: '3306',
      DB_NAME: dbName,
      DB_USERNAME: dbUser,
      DB_PASSWORD: dbPassword,
      STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
      STORAGE_ACCESS_KEY: 'minioadmin',
      STORAGE_SECRET_KEY: 'minioadmin',
      STORAGE_FILE_BUCKET: 'files',
      STORAGE_IMAGE_BUCKET: 'images',
      STORAGE_VIDEO_BUCKET: 'videos',
    };

    /**
     * Syncs compose DB values with generated .env defaults.
     */
    const composeValues = {
      MYSQL_ROOT_PASSWORD: dbRootPassword,
      MYSQL_DATABASE: dbName,
      MYSQL_USER: dbUser,
      MYSQL_PASSWORD: dbPassword,
      DB_PORT: 3306,
      DB_NAME: dbName,
      DB_USERNAME: dbUser,
      DB_PASSWORD: dbPassword,
    };

    const canWriteEnv = await canWriteFile(envOutputPath, options, rl);
    const canWriteCompose = await canWriteFile(composeOutputPath, options, rl);

    /**
     * Stops safely if user rejects overwrite prompts.
     */
    if (!canWriteEnv || !canWriteCompose) {
      console.log('Initialization canceled.');
      return;
    }

    const envTemplate = await readFile(envExamplePath, 'utf8');
    const composeTemplate = await readFile(composeExamplePath, 'utf8');

    const resolvedEnv = replaceEnvValues(envTemplate, envValues);
    let resolvedCompose = replaceComposeValues(composeTemplate, composeValues);

    /**
     * Keeps compose app port in sync with selected APP port.
     */
    resolvedCompose = resolvedCompose.replace(/-\s*'3000:3000'/, `- '${port}:3000'`);

    /**
     * Supports dry-run previews without writing to disk.
     */
    if (options.dryRun) {
      console.log(`[dry-run] Would write: ${envOutputPath}`);
      console.log(`[dry-run] Would write: ${composeOutputPath}`);
      return;
    }

    await writeFile(envOutputPath, resolvedEnv, 'utf8');
    await writeFile(composeOutputPath, resolvedCompose, 'utf8');

    /**
     * Prints setup summary for developer visibility.
     */
    console.log(`Created: ${envOutputPath}`);
    console.log(`Created: ${composeOutputPath}`);
    console.log('Secrets generated: API_KEY, JWT_SECRET, CSRF_SECRET, MYSQL_ROOT_PASSWORD');
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
