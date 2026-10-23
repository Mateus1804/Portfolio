import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRequests, validateRequest, decodeRequests, selectRequests, countRequests, updateStatus, toCsv } from '../dist/demos/solicitacoes/model.js';

const sample = (changes = {}) => ({ ...initialRequests()[0], ...changes });
test('os seis exemplos iniciais são válidos e têm identificadores únicos', () => {
  const requests = initialRequests();
  assert.equal(requests.length, 6);
  assert.equal(new Set(requests.map((request) => request.id)).size, 6);
  for (const request of requests) assert.deepEqual(validateRequest(request), request);
});
test('uma visita sem dados locais começa com os exemplos', () => assert.deepEqual(decodeRequests(null), initialRequests()));
test('uma lista vazia salva continua vazia', () => assert.deepEqual(decodeRequests('{"version":1,"requests":[]}'), []));
test('a leitura preserva os dados de uma sessão válida', () => {
  const requests = [sample({ title: 'Demanda criada no teste' })];
  assert.deepEqual(decodeRequests(JSON.stringify({ version: 1, requests })), requests);
});
test('dados corrompidos e versões incompatíveis não são aceitos', () => {
  for (const raw of ['{', 'null', '{"version":2,"requests":[]}', '{"version":1,"requests":{}}']) assert.throws(() => decodeRequests(raw));
});
test('identificadores duplicados e listas excessivas são recusados', () => {
  assert.throws(() => decodeRequests(JSON.stringify({ version: 1, requests: [sample(), sample()] })));
  assert.throws(() => decodeRequests(JSON.stringify({ version: 1, requests: Array(501).fill(sample()) })));
});
test('título respeita limites e remove espaços externos', () => {
  assert.equal(validateRequest(sample({ title: '  Revisar painel  ' })).title, 'Revisar painel');
  for (const title of ['', '  ', 'ab', 'a'.repeat(81), null, 42]) assert.throws(() => validateRequest(sample({ title })));
});
test('descrições longas ou com tipos inesperados são recusadas', () => {
  assert.throws(() => validateRequest(sample({ description: 'a'.repeat(241) })));
  assert.throws(() => validateRequest(sample({ description: null })));
  assert.equal(validateRequest(sample({ description: '' })).description, '');
});
test('valores fora das opções e nomes herdados de protótipos são recusados', () => {
  for (const change of [{ category: 'financeiro' }, { priority: 'urgente' }, { status: 'pendente' }, { status: '__proto__' }, { category: 'toString' }]) assert.throws(() => validateRequest(sample(change)));
});
test('identificadores e datas precisam ser válidos', () => {
  for (const change of [{ id: '"><script>' }, { id: '' }, { createdAt: 'data inválida' }, { createdAt: null }]) assert.throws(() => validateRequest(sample(change)));
});
test('as datas de entrada são normalizadas para UTC', () => assert.equal(validateRequest(sample({ createdAt: '2026-10-20T10:00:00-03:00' })).createdAt, '2026-10-20T13:00:00.000Z'));
test('busca ignora acentos, maiúsculas e espaços nas extremidades', () => {
  const requests = initialRequests();
  assert.equal(selectRequests(requests, { query: '  COMUNICACAO  ' }).length, 2);
  assert.equal(selectRequests(requests, { query: 'terminal' })[0].id, 'demo-004');
});
test('a descrição também participa da busca', () => assert.equal(selectRequests(initialRequests(), { query: 'fornecedores' })[0].id, 'demo-004'));
test('busca, status e prioridade combinam seus critérios', () => {
  const filtered = selectRequests(initialRequests(), { query: 'operacao', status: 'aberta', priority: 'alta' });
  assert.deepEqual(filtered.map((request) => request.id), ['demo-006']);
});
test('busca sem correspondência retorna lista vazia', () => assert.deepEqual(selectRequests(initialRequests(), { query: 'não existe esse termo' }), []));
test('a ordenação usa a criação mais recente sem alterar a lista original', () => {
  const requests = initialRequests().reverse();
  assert.equal(selectRequests(requests)[0].id, 'demo-006');
  assert.equal(requests[0].id, 'demo-001');
});
test('contagens correspondem ao total e aos status', () => assert.deepEqual(countRequests(initialRequests()), { all: 6, aberta: 3, em_andamento: 1, concluida: 2 }));
test('atualizar status não altera o objeto original e atualiza contagens', () => {
  const requests = initialRequests();
  const updated = updateStatus(requests, 'demo-006', 'concluida');
  assert.equal(requests[0].status, 'aberta');
  assert.equal(updated[0].status, 'concluida');
  assert.deepEqual(countRequests(updated), { all: 6, aberta: 2, em_andamento: 1, concluida: 3 });
});
test('atualização de registro inexistente ou status inválido falha', () => {
  assert.throws(() => updateStatus(initialRequests(), 'não-existe', 'concluida'));
  assert.throws(() => updateStatus(initialRequests(), 'demo-006', 'arquivada'));
});
test('CSV inclui BOM, cabeçalho e os rótulos legíveis', () => {
  const csv = toCsv([sample()]);
  assert.ok(csv.startsWith('\uFEFF"Título","Categoria"'));
  assert.ok(csv.includes('"Operação","Alta","Aberta"'));
  assert.equal(csv.split('\r\n').length, 2);
});
test('CSV preserva aspas, vírgulas e quebras de linha nas células', () => {
  const csv = toCsv([sample({ title: 'Revisar "painel", hoje', description: 'Primeira linha\nSegunda linha' })]);
  assert.ok(csv.includes('"Revisar ""painel"", hoje"'));
  assert.ok(csv.includes('"Primeira linha\nSegunda linha"'));
});
test('CSV neutraliza possíveis fórmulas nos campos de texto', () => {
  for (const title of ['=1+1', '+SOMA(A1)', '-2+1', '@SOMA(A1)', '  =1+1', '\t=1+1']) {
    assert.ok(toCsv([sample({ title })]).includes('"\'' + title + '"'));
  }
  assert.ok(toCsv([sample({ description: '=1+1' })]).includes('"\'=1+1"'));
});
test('CSV de seleção vazia contém somente o cabeçalho', () => assert.equal(toCsv([]).split('\r\n').length, 1));
test('entradas com HTML continuam texto no modelo', () => {
  const title = '<img src=x onerror=alert(1)>';
  assert.equal(validateRequest(sample({ title })).title, title);
});
