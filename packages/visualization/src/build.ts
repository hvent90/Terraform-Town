import { rmSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const dist = join(import.meta.dir, '..', 'dist');

// Clean old JS bundles
for (const f of readdirSync(dist)) {
  if (f.startsWith('main.') && f.endsWith('.js')) {
    rmSync(join(dist, f));
  }
}

const result = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  outdir: './dist',
  minify: true,
  naming: 'main.[hash].js',
});

if (!result.success) {
  console.error('Build failed:', result.logs);
  process.exit(1);
}

const jsFile = result.outputs[0].path.split('/').pop()!;

writeFileSync(join(dist, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Terraform Town</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
</style>
</head>
<body>
<div id="root" style="width: 100vw; height: 100vh;"></div>
<script type="module" src="./${jsFile}"></script>
</body>
</html>
`);

console.log(`Built ${jsFile} (${(result.outputs[0].size / 1024 / 1024).toFixed(2)} MB)`);
