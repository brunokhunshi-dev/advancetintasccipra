import { mkdir, copyFile, cp, rm, readFile, writeFile } from 'node:fs/promises';
const recaptchaSiteKey = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY?.trim();
if (!recaptchaSiteKey || !/^[A-Za-z0-9_-]{20,200}$/.test(recaptchaSiteKey)) {
  throw new Error('Configure RECAPTCHA_ENTERPRISE_SITE_KEY in the Vercel build environment before deploying.');
}
await rm('public', { recursive: true, force: true });
await mkdir('public');
for (const file of ['index.html', 'styles.css', 'script.js', 'leads.js', 'lead-origin.js', 'logo.svg', 'advanceccipralogo.svg', 'home.png']) {
  await copyFile(file, `public/${file}`);
}
for (const directory of ['icons', 'fotos']) await cp(directory, `public/${directory}`, { recursive: true });
