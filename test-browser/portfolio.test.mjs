import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const directory = fileURLToPath(new URL('../dist/', import.meta.url));
const prefix = '/Portfolio/';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };
let server;
let browser;
let origin;

before(async () => {
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
      let file = path.resolve(directory, '.' + decodeURIComponent(url.pathname.slice(prefix.length - 1)));
      if (file !== path.resolve(directory) && !file.startsWith(path.resolve(directory) + path.sep)) { res.writeHead(404).end(); return; }
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  // Ausência de Chromium é falha; a suíte de navegador nunca passa por skip.
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function open(options = {}) {
  const context = await browser.newContext(options);
  await context.route(url => !url.href.startsWith(origin), route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, errors };
}

for (const width of [320, 390, 768, 1440]) {
  test('as seis páginas funcionam sob /Portfolio/ na largura ' + width, async () => {
    const { context, page, errors } = await open({ viewport: { width, height: 900 } });
    try {
      for (const route of ['', 'projetos/controle-financeiro.html', 'projetos/barbearia.html', 'projetos/fluxo.html', 'projetos/portfolio.html', 'demos/solicitacoes/']) {
        const response = await page.goto(origin + prefix + route);
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, route);
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test('filtros apresentam contagem e projetos correspondentes', async () => {
  const { context, page } = await open();
  try {
    await page.goto(origin + prefix);
    for (const [filter, count] of [['android', 1], ['frontend', 2], ['fullstack', 1], ['all', 4]]) {
      await page.locator('[data-filter="' + filter + '"]').click();
      assert.equal(await page.locator('.project-card:visible').count(), count);
      assert.equal(await page.locator('[data-filter="' + filter + '"]').getAttribute('aria-pressed'), 'true');
      assert.match(await page.locator('#project-result').textContent(), new RegExp('^' + count + ' '));
    }
  } finally { await context.close(); }
});

test('menu móvel e atalho de conteúdo funcionam pelo teclado', async () => {
  const { context, page } = await open({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(origin + prefix);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'conteudo');
    await page.locator('.menu-toggle').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('.menu-toggle').evaluate(el => el === document.activeElement), true);
  } finally { await context.close(); }
});

test('a narrativa acompanha os três textos durante a rolagem', async () => {
  const { context, page } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + prefix);
    for (const id of ['observar', 'construir', 'validar']) {
      await page.locator('[data-story-step="' + id + '"]').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForFunction(expected => document.querySelector('.story-frame.is-active')?.dataset.storyFrame === expected, id);
      assert.equal(await page.locator('[data-story-frame="' + id + '"]').getAttribute('aria-hidden'), 'false');
    }
  } finally { await context.close(); }
});

test('movimento reduzido preserva os textos e pode ser alterado durante a visita', async () => {
  const { context, page } = await open({ reducedMotion: 'reduce' });
  try {
    await page.goto(origin + prefix);
    assert.equal(await page.locator('.story-enhanced').count(), 0);
    assert.equal(await page.locator('[data-story-step]:visible').count(), 3);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForSelector('.story-enhanced');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('.story-enhanced'));
    assert.equal(await page.locator('[data-story-step]:visible').count(), 3);
  } finally { await context.close(); }
});

test('sem JavaScript há quatro projetos, narrativa e contato utilizáveis', async () => {
  const { context, page } = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    await page.goto(origin + prefix);
    assert.equal(await page.locator('.project-card:visible').count(), 4);
    assert.equal(await page.locator('[data-story-step]:visible').count(), 3);
    assert.equal(await page.locator('.project-filters').isVisible(), false);
    assert.equal(await page.locator('.contact-email').getAttribute('href'), 'mailto:mateuswilliam.magalhaes@gmail.com?subject=Oportunidade%20em%20desenvolvimento');
  } finally { await context.close(); }
});

test('ícones e capturas locais carregam sem CDN', async () => {
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(origin + prefix);
    await page.waitForFunction(() => [...document.querySelectorAll('.hero .icon')].every(icon => icon.getBBox().width > 0));
    await page.waitForFunction(() => [...document.querySelectorAll('.hero img')].every(image => image.complete && image.naturalWidth > 0));
    const sprite = await page.request.get(origin + prefix + 'assets/icons/lucide.svg');
    assert.equal(sprite.status(), 200);
    assert.deepEqual(errors, []);
    await mkdir('qa', { recursive: true });
    await page.screenshot({ path: 'qa/portfolio-desktop.jpg', type: 'jpeg' });
  } finally { await context.close(); }
});
