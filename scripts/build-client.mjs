import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const clientEntry = path.join(rootDir, 'client', 'src', 'main.jsx');
const clientHtml = path.join(rootDir, 'client', 'index.html');
const publicDir = path.join(rootDir, 'server', 'public');
const assetsDir = path.join(publicDir, 'assets');
const outFile = path.join(assetsDir, 'app.js');
const htmlOut = path.join(publicDir, 'index.html');
const watchMode = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [clientEntry],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  outdir: assetsDir,
  entryNames: 'app',
  assetNames: '[name]',
  loader: {
    '.jsx': 'jsx',
    '.js': 'jsx',
    '.css': 'css'
  },
  logLevel: 'info'
};

const writeHtml = async () => {
  const template = await readFile(clientHtml, 'utf8');
  const withStyles = template.replace(
    '</head>',
    '    <link rel="stylesheet" href="/assets/app.css" />\n  </head>'
  );
  const withScript = withStyles.replace('/src/main.jsx', '/assets/app.js');
  await writeFile(htmlOut, withScript, 'utf8');
};

const runBuild = async () => {
  await mkdir(assetsDir, { recursive: true });
  await esbuild.build(buildOptions);
  await writeHtml();
  console.log(`Built frontend to ${outFile}`);
};

if (watchMode) {
  await mkdir(assetsDir, { recursive: true });
  const context = await esbuild.context(buildOptions);
  await context.watch();
  await writeHtml();
  console.log('Watching client files for changes...');
} else {
  await runBuild();
}
