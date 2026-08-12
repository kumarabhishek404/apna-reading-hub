/**
 * EAS detects the parent npm workspaces monorepo and installs from the repo root.
 * Mobile is intentionally NOT a workspace (React 18 vs root React 19), so this
 * hook installs mobile dependencies into mobile/node_modules after the root install.
 */
const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const marker = path.join(projectRoot, 'node_modules', 'expo', 'package.json');

if (existsSync(marker)) {
  console.log('[eas-post-install] mobile dependencies already present');
  process.exit(0);
}

console.log('[eas-post-install] installing mobile dependencies with npm ci');
const result = spawnSync('npm', ['ci', '--legacy-peer-deps'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
