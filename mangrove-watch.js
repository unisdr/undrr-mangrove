/**
 * Webpack watch script for Mangrove components development
 *
 * This script watches for changes in the mangrove components, builds them,
 * and optionally copies the output to a specified directory.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const copyEnabled = args.includes('--copy');
const targetPathArg = args.find(arg => arg.startsWith('--target='));

const DIST_PATH = path.resolve(__dirname, 'dist/components');
const DEFAULT_TARGET_PATH = path.resolve(
  __dirname,
  '../../../themes/custom/undrr_common/js/mangrove-components'
);
const TARGET_PATH = targetPathArg
  ? targetPathArg.split('=')[1]
  : DEFAULT_TARGET_PATH;

// Only set up target directory if copy is enabled
if (copyEnabled) {
  console.log('Copy mode enabled .js only');
  console.log(`Files will be copied to ${TARGET_PATH}`);

  // Ensure target directory exists
  if (!fs.existsSync(TARGET_PATH)) {
    fs.mkdirSync(TARGET_PATH, { recursive: true });
    console.log(`Created target directory: ${TARGET_PATH}`);
  }
}

// Start webpack in watch mode
function startWebpackWatch() {
  console.log('Starting webpack in watch mode...');

  const webpack = spawn('npx', ['webpack', '--watch', '--progress'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  webpack.on('error', error => {
    console.error('Failed to start webpack:', error);
  });

  webpack.on('close', code => {
    if (code !== 0) {
      console.error(`Webpack process exited with code ${code}`);
    }
  });

  return webpack;
}

// Watch the dist directory for changes and copy files to target
function watchAndCopyFiles() {
  console.log(`Watching for changes in ${DIST_PATH}`);

  if (!copyEnabled) {
    console.log('Copy mode is disabled. Files will not be copied.');
    return;
  }

  console.log(`Files will be copied to ${TARGET_PATH}`);
  console.log('Only .js files will be copied');

  // Initial copy of existing files
  // copyAllFiles();

  fs.watch(DIST_PATH, { recursive: true }, (eventType, filename) => {
    if (filename) {
      const sourcePath = path.join(DIST_PATH, filename);
      const targetPath = path.join(TARGET_PATH, filename);

      // Make sure the file exists (watch can trigger on deletions too)
      if (fs.existsSync(sourcePath) && !sourcePath.includes('node_modules')) {
        copyFile(sourcePath, targetPath);
      }
    }
  });
}

function copyFile(source, target) {
  try {
    if (!source.endsWith('.js')) {
      return;
    }

    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(source, target);
    console.log(`Copied: ${path.basename(source)} to ${target}`);
  } catch (err) {
    console.error(`Error copying ${source}:`, err);
  }
}

// TODO: Possibly remove
function copyAllFiles() {
  if (!copyEnabled) {
    return;
  }

  try {
    if (!fs.existsSync(DIST_PATH)) {
      console.log(
        'Dist directory does not exist yet. Will copy files when they are built.'
      );
      return;
    }

    const files = fs.readdirSync(DIST_PATH);

    if (files.length === 0) {
      console.log(
        'No files found in dist directory. Will copy files when they are built.'
      );
      return;
    }

    console.log('Copying existing files from dist to target...');

    files.forEach(file => {
      const sourcePath = path.join(DIST_PATH, file);
      const targetPath = path.join(TARGET_PATH, file);

      if (fs.statSync(sourcePath).isFile()) {
        copyFile(sourcePath, targetPath);
      }
    });

    console.log('Initial file copy complete.');
  } catch (err) {
    console.error('Error during initial file copy:', err);
  }
}

// Start both processes
const webpackProcess = startWebpackWatch();
watchAndCopyFiles();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  webpackProcess.kill();
  process.exit(0);
});
