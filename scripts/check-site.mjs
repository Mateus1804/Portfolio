import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const failures = [];
const htmlCache = new Map();
const svgCache = new Map();
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const files = await walk(root);
const report = (file, message) => failures.push(path.relative(root, file) + ': ' + message);
const readHtml = async (file) => {
  if (!htmlCache.has(file)) htmlCache.set(file, await readFile(file, 'utf8'));
  return htmlCache.get(file);
};
let links = 0;
const external = new Set();
for (const file of files.filter((file) => file.endsWith('.html'))) {
  const html = await readHtml(file);
  if (!/<html\s[^>]*lang="pt-BR"/.test(html)) report(file, 'idioma pt-BR ausente');
  if (!/<meta\s+name="viewport"/.test(html)) report(file, 'viewport ausente');
  if (!/<meta\s+name="description"\s+content="[^"\s][^"]*"/.test(html)) report(file, 'descrição ausente');
  if (!/<title>[^<]+<\/title>/.test(html)) report(file, 'título ausente');
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) report(file, 'a página deve ter um h1');
  if (!/<main[\s>]/.test(html)) report(file, 'marco principal ausente');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) report(file, 'ids duplicados');
  for (const image of html.matchAll(/<img\s[^>]*>/g)) if (!/\salt="[^"]*"/.test(image[0])) report(file, 'imagem sem atributo alt');
  for (const anchor of html.matchAll(/<a\s[^>]*>/g)) if (/target="_blank"/.test(anchor[0]) && !/rel="[^"]*noopener/.test(anchor[0])) report(file, 'link de nova aba sem noopener');
  for (const match of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    links += 1;
    const value = match[1].replace(/&amp;/g, '&');
    if (!value || value === '#') { report(file, 'link vazio'); continue; }
    if (/^(https?:|mailto:)/.test(value)) { external.add(value); continue; }
    if (/^(data:|tel:)/.test(value)) continue;
    const url = new URL(value, 'https://example.invalid/' + path.relative(root, file).split(path.sep).join('/'));
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (!target.startsWith(root)) { report(file, 'caminho fora do site: ' + value); continue; }
    try {
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      await stat(target);
      if (url.hash && target.endsWith('.svg')) {
        if (!svgCache.has(target)) svgCache.set(target, await readFile(target, 'utf8'));
        const svgIds = [...svgCache.get(target).matchAll(/\sid="([^"]+)"/g)].map((entry) => entry[1]);
        if (!svgIds.includes(decodeURIComponent(url.hash.slice(1)))) report(file, 'símbolo SVG inexistente: ' + value);
      }
      if (url.hash && target.endsWith('.html')) {
        const targetHtml = await readHtml(target);
        const targetIds = [...targetHtml.matchAll(/\sid="([^"]+)"/g)].map((entry) => entry[1]);
        if (!targetIds.includes(decodeURIComponent(url.hash.slice(1)))) report(file, 'âncora inexistente: ' + value);
      }
    } catch { report(file, 'arquivo inexistente: ' + value); }
  }
}
for (const file of files.filter((file) => file.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch { report(file, 'JavaScript com erro de sintaxe'); }
}
const pdf = await readFile(path.join(root, 'assets/curriculo-mateus-william.pdf'));
if (pdf.subarray(0, 5).toString() !== '%PDF-') failures.push('Currículo não é um PDF válido.');
if (failures.length) { process.stderr.write(failures.join('\n') + '\n'); process.exitCode = 1; }
else console.log('OK: ' + htmlCache.size + ' páginas HTML, ' + links + ' referências, ' + files.length + ' arquivos; caminhos internos, âncoras, imagens e sintaxe JavaScript conferidos. ' + external.size + ' destinos externos registrados (disponibilidade externa exige verificação separada).');
