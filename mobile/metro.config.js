const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Mobile is outside npm workspaces (React 18) while the web monorepo uses React 19.
// Prefer this package's node_modules and block the parent React copies.
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.blockList = [
  new RegExp(`^${path.resolve(monorepoRoot, 'node_modules')}/react(/.*)?$`),
  new RegExp(`^${path.resolve(monorepoRoot, 'node_modules')}/react-dom(/.*)?$`),
  new RegExp(`^${path.resolve(monorepoRoot, 'node_modules')}/react-native(/.*)?$`),
];
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

module.exports = config;
