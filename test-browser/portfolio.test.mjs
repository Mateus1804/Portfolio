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
    for (const [filter, count] of [['android', 1], ['frontend', 1], ['fullstack', 1], ['all', 3]]) {
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

test('a narrativa acompanha os quatro textos durante a rolagem', async () => {
  const { context, page } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + prefix);
    for (const id of ['observar', 'organizar', 'acompanhar', 'concluir']) {
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
    assert.equal(await page.locator('[data-story-step]:visible').count(), 4);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForSelector('.story-enhanced');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('.story-enhanced'));
    assert.equal(await page.locator('[data-story-step]:visible').count(), 4);
  } finally { await context.close(); }
});

test('sem JavaScript há três projetos, narrativa e contato utilizáveis', async () => {
  const { context, page } = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    await page.goto(origin + prefix);
    assert.equal(await page.locator('.project-card:visible').count(), 3);
    assert.equal(await page.locator('[data-story-step]:visible').count(), 4);
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


test('capturas e gravação pública do ciclo com dados fictícios', async () => {
  const { captureDemo } = await import('../scripts/capture-demo.mjs');
  await captureDemo(origin + prefix);
});

async function openFluxo(options = {}) {
  const result = await open(options);
  await result.page.goto(origin + prefix + 'demos/solicitacoes/');
  return result;
}

test('Fluxo edita prazo e campos, mantém criação e exibe histórico após recarregar', async () => {
  const {context,page,errors}=await openFluxo();
  try {
    await page.getByRole('button',{name:'Editar e detalhes de Conferir checklist de abertura',exact:true}).click();
    await page.locator('#request-title').fill('Checklist revisado no teste');
    await page.locator('#request-due').fill('2026-11-05');
    await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
    await page.reload();
    assert.equal(await page.getByRole('heading',{name:'Checklist revisado no teste',exact:true}).count(),1);
    await page.getByRole('button',{name:'Editar e detalhes de Checklist revisado no teste',exact:true}).click();
    assert.equal(await page.locator('#request-due').inputValue(),'2026-11-05');
    assert.match(await page.locator('#request-history').textContent(),/Campos da solicitação/);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mw:fluxo:v1')));
    assert.equal(saved.version,2); assert.equal(saved.requests.length,6); assert.equal(saved.requests[0].id,'demo-006'); assert.equal(saved.requests[0].createdAt,'2026-10-20T13:00:00.000Z');
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('Kanban atualiza o mesmo registro e arquivamento pode ser desfeito', async () => {
  const {context,page}=await openFluxo();
  try {
    await page.getByRole('button',{name:'Kanban',exact:true}).click();
    await page.getByLabel('Status de Conferir checklist de abertura',{exact:true}).selectOption('concluida');
    assert.equal(await page.locator('.kanban-column').filter({has:page.getByRole('heading',{name:'Concluída · 3',exact:true})}).getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),1);
    await page.getByRole('button',{name:'Arquivar Conferir checklist de abertura',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),0);
    await page.getByRole('button',{name:'Desfazer última alteração',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),1);
    await page.getByRole('button',{name:'Arquivar Conferir checklist de abertura',exact:true}).click();
    await page.getByLabel('Ver arquivadas',{exact:true}).check();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),1);
    await page.getByRole('button',{name:'Desarquivar Conferir checklist de abertura',exact:true}).click();
    await page.getByLabel('Ver arquivadas',{exact:true}).uncheck();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),1);
  } finally {await context.close();}
});

test('backup real de download é recuperado só após prévia e confirmação', async () => {
  const {context,page}=await openFluxo({acceptDownloads:true});
  try {
    const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Salvar backup JSON',exact:true}).click();
    const file=await (await pending).path();
    await page.getByRole('button',{name:'Arquivar Conferir checklist de abertura',exact:true}).click();
    await page.locator('#backup-file').setInputFiles(file);
    await page.locator('#restore-dialog').waitFor({state:'visible'});
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),0);
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),0);
    await page.locator('#backup-file').setInputFiles(file);
    await page.getByRole('button',{name:'Confirmar substituição',exact:true}).click();
    await page.reload();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),1);
  } finally {await context.close();}
});

test('arquivo inválido não altera os dados; entradas HTML continuam texto', async () => {
  const {context,page,errors}=await openFluxo();
  try {
    const bad={name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{"application":"outro","version":2,"requests":[]}')};
    await page.locator('#backup-file').setInputFiles(bad);
    await page.waitForFunction(()=>document.querySelector('#action-status').textContent.includes('Backup não carregado'));
    assert.equal(await page.locator('#restore-dialog').isVisible(),false);
    assert.equal(await page.locator('.request-item').count(),6);
    await page.getByRole('button',{name:'Nova solicitação',exact:true}).click();
    await page.locator('#request-title').fill('<img src=x onerror=alert(1)>');
    await page.getByRole('button',{name:'Criar solicitação',exact:true}).click();
    assert.equal(await page.locator('.requests-list img').count(),0);
    assert.equal(await page.getByRole('heading',{name:'<img src=x onerror=alert(1)>',exact:true}).count(),1);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('conflito entre abas preserva formulário e não sobrescreve a versão externa', async () => {
  const {context,page}=await openFluxo();
  try {
    const other=await context.newPage(); await other.goto(origin+prefix+'demos/solicitacoes/');
    await page.getByRole('button',{name:'Editar e detalhes de Conferir checklist de abertura',exact:true}).click();
    await page.locator('#request-title').fill('Alteração na sessão principal');
    await other.getByLabel('Status de Conferir checklist de abertura',{exact:true}).selectOption('em_andamento');
    await page.waitForFunction(()=>!document.querySelector('#storage-panel').hidden);
    assert.equal(await page.locator('#request-title').inputValue(),'Alteração na sessão principal');
    await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
    assert.match(await page.locator('#action-status').textContent(),/Apenas nesta sessão/);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mw:fluxo:v1')));
    assert.equal(stored.requests[0].status,'em_andamento'); assert.equal(stored.requests[0].title,'Conferir checklist de abertura');
    await page.getByRole('button',{name:'Carregar dados salvos',exact:true}).click();
    await page.getByRole('button',{name:'Manter sessão',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'Alteração na sessão principal',exact:true}).count(),1);
    await page.getByRole('button',{name:'Carregar dados salvos',exact:true}).click();
    await page.getByRole('button',{name:'Carregar versão salva',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'Conferir checklist de abertura',exact:true}).count(),1);
    assert.equal(await page.getByLabel('Status de Conferir checklist de abertura',{exact:true}).inputValue(),'em_andamento');
  } finally {await context.close();}
});

test('armazenamento bloqueado mantém uso e exportação sem anunciar salvamento', async () => {
  const {context,page,errors}=await open();
  try {
    await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Bloqueado','QuotaExceededError');};});
    await page.goto(origin+prefix+'demos/solicitacoes/');
    await page.getByLabel('Status de Conferir checklist de abertura',{exact:true}).selectOption('concluida');
    assert.match(await page.locator('#action-status').textContent(),/Apenas nesta sessão/);
    const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Salvar backup JSON',exact:true}).click();
    const json=JSON.parse(await readFile(await (await pending).path(),'utf8'));
    assert.equal(json.requests[0].status,'concluida'); assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('movimento reduzido e celular mantêm todas as prévias junto dos textos', async () => {
  const {context,page}=await open({viewport:{width:390,height:844}});
  try {
    await page.goto(origin+prefix);
    assert.equal(await page.locator('.story-step .story-frame:visible').count(),4);
    assert.equal(await page.locator('.story-stage:visible').count(),0);
    await page.setViewportSize({width:1440,height:900});
    await page.waitForSelector('.story-enhanced');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForSelector('.story-inline');
    assert.equal(await page.locator('.story-step .story-frame:visible').count(),4);
  } finally {await context.close();}
});

test('captura ampliada fecha com Escape e devolve foco ao link', async()=>{
  const {context,page}=await open();
  try{
    await page.goto(origin+prefix+'projetos/controle-financeiro.html');
    const link=page.locator('.interface-gallery a').first();await link.click();
    assert.equal(await page.getByRole('dialog',{name:'Captura do projeto',exact:true}).isVisible(),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.image-dialog').isVisible(),false);
    assert.equal(await link.evaluate(el=>el===document.activeElement),true);
  }finally{await context.close();}
});

test('Fluxo migra armazenamento anterior ao primeiro salvamento', async()=>{
  const {context,page}=await open();
  try{
    await page.addInitScript(()=>localStorage.setItem('mw:fluxo:v1',JSON.stringify({version:1,requests:[{id:'legado',title:'Registro preservado',description:'Anterior à atualização',category:'operacao',priority:'normal',status:'aberta',createdAt:'2025-05-01T12:00:00Z'}]})));
    await page.goto(origin+prefix+'demos/solicitacoes/');
    assert.equal(await page.locator('.request-item').count(),1);
    await page.getByLabel('Status de Registro preservado',{exact:true}).selectOption('em_andamento');
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mw:fluxo:v1')));
    assert.equal(saved.version,2);assert.equal(saved.requests[0].id,'legado');assert.equal(saved.requests[0].dueDate,'');assert.equal(saved.requests[0].history.length,1);
  }finally{await context.close();}
});

test('filtros de prazo e roteiro guiado funcionam sem alterar exemplos até a confirmação',async()=>{
  const {context,page}=await openFluxo();
  try{
    await page.locator('[data-due="late"]').click();assert.equal(await page.locator('.request-item').count(),1);
    await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
    await page.getByRole('button',{name:'Iniciar demonstração guiada',exact:true}).click();
    await page.getByRole('button',{name:'Criar exemplo guiado',exact:true}).click();
    assert.equal(await page.locator('#request-title').inputValue(),'Preparar checklist de exemplo');
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
    assert.equal(await page.locator('.request-item').count(),6);
  }finally{await context.close();}
});

test('Fluxo permanece sem rolagem horizontal com texto espaçado e formulário no celular',async()=>{
  const {context,page}=await openFluxo({viewport:{width:320,height:650}});
  try{
    await page.addStyleTag({content:'*{letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.5!important}p{margin-bottom:2em!important}'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,await page.evaluate(()=>JSON.stringify([...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({cls:el.className,tag:el.tagName,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,50)})))));
    await page.getByRole('button',{name:'Nova solicitação',exact:true}).click();
    await page.locator('#request-title').fill('Solicitação longa para conferir a tela pequena');
    await page.getByRole('button',{name:'Criar solicitação',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'Solicitação longa para conferir a tela pequena',exact:true}).count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,await page.evaluate(()=>JSON.stringify([...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({cls:el.className,tag:el.tagName,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,50)})))));
    await page.getByRole('button',{name:'Kanban',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,await page.evaluate(()=>JSON.stringify([...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({cls:el.className,tag:el.tagName,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,50)})))));
  }finally{await context.close();}
});

test('armazenamento ilegível oferece sessão de exemplo e exportação',async()=>{
  const {context,page,errors}=await open();
  try{
    await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Bloqueado','SecurityError')};});
    await page.goto(origin+prefix+'demos/solicitacoes/');
    assert.equal(await page.locator('.request-item').count(),6);
    assert.equal(await page.locator('#storage-panel').isVisible(),true);
    await page.getByLabel('Status de Conferir checklist de abertura',{exact:true}).selectOption('em_andamento');
    assert.match(await page.locator('#action-status').textContent(),/Apenas nesta sessão/);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('restaurar exemplos permite recuperar armazenamento corrompido após confirmação',async()=>{
  const {context,page}=await open();
  try{
    await page.addInitScript(()=>localStorage.setItem('mw:fluxo:v1','{corrompido'));
    await page.goto(origin+prefix+'demos/solicitacoes/');
    assert.equal(await page.locator('#storage-panel').isVisible(),true);
    await page.getByRole('button',{name:'Restaurar dados de exemplo',exact:true}).click();
    await page.getByRole('button',{name:'Restaurar exemplos',exact:true}).click();
    assert.equal(await page.locator('#storage-panel').isVisible(),false);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mw:fluxo:v1')).version),2);
  }finally{await context.close();}
});
