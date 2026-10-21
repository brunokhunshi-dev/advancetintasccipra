import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
await rm('public', { recursive: true, force: true });
await mkdir('public');
for (const file of ['index.html', 'styles.css', 'script.js', 'leads.js', 'logo.svg', 'advanceccipralogo.svg', 'home.png']) {
  await copyFile(file, `public/${file}`);
}
for (const directory of ['icons', 'fotos']) await cp(directory, `public/${directory}`, { recursive: true });
