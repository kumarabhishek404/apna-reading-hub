#!/usr/bin/env node
/**
 * Start Metro over USB/emulator loopback so airplane mode does not kill the
 * development build. The LAN URL (192.168.x.x:8081) is unreachable when Wi-Fi
 * is off; adb reverse maps device 127.0.0.1:8081 to this machine.
 */
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.RCT_METRO_PORT || '8081';
const HOME = process.env.HOME || '';
const adbCandidates = [
  process.env.ADB,
  process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb'),
  process.env.ANDROID_SDK_ROOT && path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb'),
  path.join(HOME, 'Library/Android/sdk/platform-tools/adb'),
  'adb',
].filter(Boolean);

function resolveAdb() {
  for (const candidate of adbCandidates) {
    if (candidate === 'adb') {
      try {
        execFileSync('adb', ['version'], { stdio: 'ignore' });
        return 'adb';
      } catch {
        continue;
      }
    }
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function adb(adbPath, args) {
  return execFileSync(adbPath, args, { encoding: 'utf8' }).trim();
}

const adbPath = resolveAdb();
if (!adbPath) {
  console.error('adb not found. Install Android platform-tools or set ANDROID_HOME.');
  process.exit(1);
}

const devices = adb(adbPath, ['devices'])
  .split('\n')
  .slice(1)
  .map((line) => line.split('\t')[0])
  .filter(Boolean);

if (devices.length === 0) {
  console.error('No Android emulator/device connected.');
  process.exit(1);
}

for (const device of devices) {
  execFileSync(adbPath, ['-s', device, 'reverse', `tcp:${PORT}`, `tcp:${PORT}`], {
    stdio: 'inherit',
  });
  console.log(`[dev-usb] ${device}: adb reverse tcp:${PORT} -> tcp:${PORT}`);
}

const expo = spawn(
  'npx',
  ['expo', 'start', '--localhost', '--android', '--port', PORT],
  {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env,
  },
);

expo.on('exit', (code) => process.exit(code ?? 0));
