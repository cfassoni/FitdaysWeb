#!/usr/bin/env node

/**
 * RecompPro - GitHub App Installation Access Token Helper
 * 
 * Generates an installation access token using the GitHub App credentials in `.env`.
 * Can be used directly to output the token, or to wrap commands (e.g. git, gh).
 * 
 * Usage:
 *   node scripts/github-app-token.mjs                  # Prints access token to stdout
 *   node scripts/github-app-token.mjs export           # Prints `export GITHUB_TOKEN=...`
 *   node scripts/github-app-token.mjs run <command...> # Runs command with GITHUB_TOKEN set
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  const env = { ...process.env };

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
      if (match) {
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!env[match[1]]) {
          env[match[1]] = val;
        }
      }
    }
  }

  return env;
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

export async function getInstallationToken() {
  const env = loadEnv();
  const appId = env.GITHUB_APP_ID;
  const installationId = env.GITHUB_INSTALLATION_ID;
  let keySetting = env.GITHUB_PRIVATE_KEY;

  if (!appId || !installationId || !keySetting) {
    throw new Error(
      'Missing required GitHub App credentials in environment or .env: ' +
      'GITHUB_APP_ID, GITHUB_INSTALLATION_ID, and GITHUB_PRIVATE_KEY must be defined.'
    );
  }

  if (keySetting.startsWith('~/')) {
    keySetting = path.join(os.homedir(), keySetting.slice(2));
  }

  let privateKeyPem;
  if (fs.existsSync(keySetting)) {
    privateKeyPem = fs.readFileSync(keySetting, 'utf-8');
  } else {
    privateKeyPem = keySetting;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iat: now - 60, // 60 seconds clock drift leeway
    exp: now + 600, // 10 minutes maximum allowed for GitHub App JWT
    iss: appId,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKeyPem, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'RecompPro-Agent',
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitHub API error (${response.status}): Failed to generate installation access token. ${errorBody}`
    );
  }

  const data = await response.json();
  return {
    token: data.token,
    expiresAt: data.expires_at,
    permissions: data.permissions,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'token';

  try {
    if (command === '--help' || command === '-h' || command === 'help') {
      console.log(`
GitHub App Token Utility

Usage:
  node scripts/github-app-token.mjs [command]

Commands:
  token (default)   Outputs the installation access token string
  export            Outputs 'export GITHUB_TOKEN=...' for shell eval
  run <cmd> [args]  Runs the command with GITHUB_TOKEN and git auth configured
  status            Checks token generation and prints permissions & expiration
`);
      return;
    }

    if (command === 'token') {
      const { token } = await getInstallationToken();
      process.stdout.write(token);
      return;
    }

    if (command === 'export') {
      const { token } = await getInstallationToken();
      console.log(`export GITHUB_TOKEN="${token}"`);
      return;
    }

    if (command === 'status') {
      const { token, expiresAt, permissions } = await getInstallationToken();
      console.log('GitHub App Authentication Status:');
      console.log(`- Token: ${token.slice(0, 8)}... (Length: ${token.length})`);
      console.log(`- Expires At: ${expiresAt}`);
      console.log('- Permissions:', JSON.stringify(permissions, null, 2));
      return;
    }

    if (command === 'run') {
      const subCommand = args[1];
      const subArgs = args.slice(2);
      if (!subCommand) {
        console.error('Error: "run" requires a command to execute.');
        process.exit(1);
      }

      const { token } = await getInstallationToken();
      const basicAuth = Buffer.from(`x-access-token:${token}`).toString('base64');
      const gitExtraHeader = `http.extraHeader=Authorization: Basic ${basicAuth}`;

      const env = {
        ...process.env,
        GITHUB_TOKEN: token,
        GH_TOKEN: token,
      };

      // If running git directly, automatically add git extraHeader if not already present
      let finalCmd = subCommand;
      let finalArgs = subArgs;
      if (subCommand === 'git') {
        finalArgs = ['-c', gitExtraHeader, ...subArgs];
      }

      const res = spawnSync(finalCmd, finalArgs, {
        env,
        stdio: 'inherit',
      });

      process.exit(res.status ?? 0);
    }

    console.error(`Unknown command: ${command}`);
    process.exit(1);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
