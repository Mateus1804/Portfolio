import { STORAGE_KEY, MAX_REQUESTS, STATUSES, PRIORITIES, CATEGORIES, initialRequests, validateRequest, decodeRequests, selectRequests, countRequests, updateStatus, toCsv } from './model.js';

const $ = (selector) => document.querySelector(selector);
const storageNotice = $('#storage-notice');
const announce = (message) => { $('#action-status').textContent = message; };
const showStorageNotice = (message) => { storageNotice.textContent = message; storageNotice.hidden = false; };
let requests;
let storageConflict = false;
try {
  requests = decodeRequests(localStorage.getItem(STORAGE_KEY));
} catch {
  requests = initialRequests();
  // Não sobrescreve dados incompatíveis silenciosamente; restaurar é uma ação explícita.
  storageConflict = true;
  showStorageNotice('Não foi possível ler os dados locais. Os exemplos estão disponíveis nesta sessão. Use “Restaurar dados de exemplo” para substituir os dados salvos.');
}

const filters = { query: '', status: 'all', priority: 'all' };
function persist() {
  if (storageConflict) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, requests }));
    storageNotice.hidden = true;
  } catch {
    showStorageNotice('O navegador não permitiu salvar. Você pode usar o painel nesta sessão e exportar o CSV. As alterações podem se perder ao recarregar.');
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function requestRow(request) {
  const item = element('li', 'request-item');
  const content = element('div');
  const titleRow = element('div', 'request-title-row');
  titleRow.append(element('h3', '', request.title), element('span', `priority-tag${request.priority === 'alta' ? ' high' : ''}`, `Prioridade ${PRIORITIES[request.priority].toLocaleLowerCase('pt-BR')}`));
  content.append(titleRow);
  if (request.description) content.append(element('p', 'request-description', request.description));
  const metadata = element('p', 'request-meta');
  const createdDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(request.createdAt));
  metadata.append(element('span', 'category-tag', CATEGORIES[request.category]), element('span', '', `Criada em ${createdDate}`));
  content.append(metadata);
  const selectLabel = element('label', 'sr-only', `Status de ${request.title}`);
  const select = element('select', 'status-select');
  select.id = `status-${request.id}`;
  selectLabel.htmlFor = select.id;
  select.dataset.id = request.id;
  select.dataset.value = request.status;
  for (const [value, label] of Object.entries(STATUSES)) {
    const option = element('option', '', label);
    option.value = value;
    option.selected = value === request.status;
    select.append(option);
  }
  const statusField = element('div');
  statusField.append(selectLabel, select);
  item.append(content, statusField);
  return item;
}

function render() {
  const counts = countRequests(requests);
  for (const node of document.querySelectorAll('[data-count]')) node.textContent = String(counts[node.dataset.count]);
  for (const button of document.querySelectorAll('[data-status]')) {
    const selected = button.dataset.status === filters.status;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('active', selected);
  }
  const visible = selectRequests(requests, filters);
  $('#result-count').textContent = `${visible.length} de ${requests.length} ${requests.length === 1 ? 'solicitação' : 'solicitações'} · mais recentes primeiro`;
  $('#requests-list').replaceChildren(...visible.map(requestRow));
  $('#empty-state').hidden = visible.length > 0;
  $('#export-csv').disabled = visible.length === 0;
}

$('#search').addEventListener('input', (event) => { filters.query = event.target.value; render(); });
$('#priority-filter').addEventListener('change', (event) => { filters.priority = event.target.value; render(); });
for (const button of document.querySelectorAll('[data-status]')) button.addEventListener('click', () => { filters.status = button.dataset.status; render(); });
function clearFilters() {
  filters.query = '';
  filters.status = 'all';
  filters.priority = 'all';
  $('#search').value = '';
  $('#priority-filter').value = 'all';
  render();
}
$('#clear-filters').addEventListener('click', clearFilters);
$('#empty-clear').addEventListener('click', () => { clearFilters(); $('#search').focus(); });

$('#requests-list').addEventListener('change', (event) => {
  const select = event.target.closest('.status-select');
  if (!select) return;
  try {
    const requestId = select.dataset.id;
    requests = updateStatus(requests, requestId, select.value);
    persist();
    render();
    // A linha pode sair do filtro atual. Mantém o foco em um controle existente.
    (document.getElementById(`status-${requestId}`) || document.querySelector(`[data-status="${filters.status}"]`)).focus();
    announce('Status atualizado.');
  } catch (error) { announce(error.message); }
});

const requestDialog = $('#request-dialog');
$('#new-request').addEventListener('click', () => {
  $('#request-form').reset();
  $('#form-error').textContent = '';
  requestDialog.showModal();
});
for (const selector of ['#close-dialog', '#cancel-dialog']) $(selector).addEventListener('click', () => requestDialog.close());
$('#request-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    if (requests.length >= MAX_REQUESTS) throw new Error('A demonstração comporta até 500 solicitações. Exporte o CSV e restaure os exemplos para recomeçar.');
    const data = new FormData(event.target);
    // getRandomValues também funciona no preview HTTP; o identificador é apenas local.
    const id = 'local-' + Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join('-');
    const request = validateRequest({ id, title: data.get('title'), category: data.get('category'), priority: data.get('priority'), status: 'aberta', description: data.get('description'), createdAt: new Date().toISOString() });
    requests = [request, ...requests];
    persist();
    clearFilters();
    requestDialog.close();
    announce('Solicitação criada. Os filtros foram limpos para exibi-la na lista.');
  } catch (error) { $('#form-error').textContent = error.message; }
});

$('#export-csv').addEventListener('click', () => {
  const blob = new Blob([toCsv(selectRequests(requests, filters))], { type: 'text/csv;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = element('a');
  link.href = objectUrl;
  link.download = 'fluxo-solicitacoes.csv';
  document.body.append(link);
  link.click();
  link.remove();
  // Dá tempo ao navegador para iniciar o download antes de liberar o recurso.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  announce('CSV gerado com as solicitações do filtro atual.');
});

const resetDialog = $('#reset-dialog');
$('#reset-demo').addEventListener('click', () => resetDialog.showModal());
$('#cancel-reset').addEventListener('click', () => resetDialog.close());
$('#confirm-reset').addEventListener('click', () => {
  requests = initialRequests();
  storageConflict = false;
  persist();
  clearFilters();
  resetDialog.close();
  announce('Os seis exemplos iniciais foram restaurados.');
});

// A demo é local e usa a última gravação por aba. Avisa em vez de sobrescrever uma edição aberta.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    storageConflict = true;
    showStorageNotice('Os dados foram alterados em outra aba. A gravação local foi pausada. Exporte suas alterações antes de recarregar para usar a versão mais recente.');
  }
});
render();
