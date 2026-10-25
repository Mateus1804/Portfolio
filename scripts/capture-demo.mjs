// Evidências reproduzíveis com dados fictícios. Executar somente na prévia local.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
export async function captureDemo(base) {
if (!base || !['terminal.local','127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Informe a URL da prévia local.');
const browser = await chromium.launch();
await mkdir('qa/video', { recursive: true });
await mkdir('qa/capture', { recursive: true });
try {
  const card = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await card.goto(new URL('assets/images/compartilhamento.svg', base).href);
  await card.screenshot({ path: 'qa/capture/compartilhamento.png' });
  await card.close();
  const context = await browser.newContext({ viewport: { width: 1100, height: 850 }, reducedMotion: 'reduce', recordVideo: { dir: 'qa/video', size: { width: 1100, height: 850 } } });
  const page = await context.newPage();
  await page.goto(new URL('demos/solicitacoes/', base).href);
  await page.screenshot({ path: 'qa/capture/fluxo-demo.jpg', type: 'jpeg', quality: 85 });
  // Pausas intencionais para tornar a gravação legível, não para sincronizar os testes.
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'Nova solicitação', exact: true }).click();
  await page.getByLabel('Título', { exact: false }).pressSequentially('Conferir materiais de exemplo', { delay: 65 });
  await page.locator('#request-due').fill('2026-11-05');
  await page.getByLabel('Descrição', { exact: false }).pressSequentially('Organizar o checklist antes da entrega.', { delay: 50 });
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'Criar solicitação', exact: true }).click();
  await page.waitForTimeout(900);
  await page.getByLabel('Status de Conferir materiais de exemplo', { exact: true }).selectOption('em_andamento');
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'Kanban', exact: true }).click();
  await page.waitForTimeout(900);
  await page.getByLabel('Status de Conferir materiais de exemplo', { exact: true }).selectOption('concluida');
  await page.getByRole('button', { name: 'Editar e detalhes de Conferir materiais de exemplo', exact: true }).click();
  await page.locator('#history-section').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'qa/capture/fluxo-historico.jpg', type: 'jpeg' });
  await page.waitForTimeout(1200);
  const video = page.video();
  await context.close();
  await video.saveAs('qa/capture/fluxo-demonstracao.webm');
  const shots = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const shot = await shots.newPage();
  await shot.goto(base);
  await shot.screenshot({ path: 'qa/capture/portfolio-evolucao-desktop.jpg', type: 'jpeg', quality: 85 });
  await shot.emulateMedia({ reducedMotion: 'no-preference' });
  await shot.locator('[data-story-step="organizar"]').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await shot.waitForFunction(() => {
    const active = document.querySelector('.story-frame.is-active');
    return active?.dataset.storyFrame === 'organizar' && getComputedStyle(active).opacity === '1' && [...document.querySelectorAll('.story-frame:not(.is-active)')].every(frame => getComputedStyle(frame).opacity === '0');
  });
  await shot.screenshot({ path: 'qa/capture/portfolio-evolucao-storytelling.jpg', type: 'jpeg', quality: 85 });
  await shot.goto(new URL('demos/solicitacoes/', base).href);
  await shot.screenshot({ path: 'qa/capture/fluxo-evolucao-desktop.jpg', type: 'jpeg', quality: 85 });
  await shot.getByRole('button', { name: 'Kanban', exact: true }).click();
  await shot.locator('#requests-board').scrollIntoViewIfNeeded();
  await shot.screenshot({ path: 'qa/capture/fluxo-kanban.jpg', type: 'jpeg', quality: 85 });
  await shot.setViewportSize({ width: 390, height: 844 });
  await shot.goto(base);
  await shot.screenshot({ path: 'qa/capture/portfolio-evolucao-mobile.jpg', type: 'jpeg', quality: 85 });
  await shot.goto(new URL('demos/solicitacoes/', base).href);
  await shot.screenshot({ path: 'qa/capture/fluxo-evolucao-mobile.jpg', type: 'jpeg', quality: 85 });
  await shots.close();
  console.log('Capturas e gravação criadas com dados fictícios.');
} finally { await browser.close(); }

}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) await captureDemo(process.argv[2]);
