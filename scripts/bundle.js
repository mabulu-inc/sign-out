/**
 * Build a Lambda deployment zip containing dist/ and production
 * node_modules. The zip lands at the project root as sign-out.zip.
 *
 * Usage: node scripts/bundle.js
 *
 * Assumes `pnpm run build` has already been run (dist/ exists).
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const staging = resolve(root, '.bundle-staging');

// Clean previous staging
if (existsSync(staging)) {
  rmSync(staging, { recursive: true });
}
mkdirSync(staging);

// Copy dist
cpSync(resolve(root, 'dist'), resolve(staging, 'dist'), { recursive: true });

// Copy package.json (so pnpm install --prod can resolve deps)
cpSync(resolve(root, 'package.json'), resolve(staging, 'package.json'));
cpSync(resolve(root, 'pnpm-lock.yaml'), resolve(staging, 'pnpm-lock.yaml'));

// Install production deps only
// Lambda doesn't follow symlinks, so hoist deps into a flat node_modules.
execSync('pnpm install --prod --frozen-lockfile --node-linker=hoisted', {
  cwd: staging,
  stdio: 'inherit',
});

// Zip it
const zipPath = resolve(root, 'sign-out.zip');
execSync(`zip -qr "${zipPath}" dist node_modules package.json`, {
  cwd: staging,
  stdio: 'inherit',
});

// Cleanup
rmSync(staging, { recursive: true });

console.log(`Bundled → ${zipPath}`);
