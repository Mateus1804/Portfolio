import {
  STORAGE_KEY,
  MAX_REQUESTS,
  MAX_BACKUP_BYTES,
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  initialRequests,
  validateRequest,
  decodeRequests,
  selectRequests,
  countRequests,
  updateStatus,
  editRequest,
  isLate,
  todayKey,
  toCsv,
  toBackup,
  fromBackup
} from './model.js';

const $ = (selector) => document.querySelector(selector);
const announce = (message) => {
  $('#action-status').textContent = message;
};
const showNotice = (message) => {
  $('#storage-notice').textContent = message;
  $('#storage-panel').hidden = false;
};
let requests,
  lastSaved = null,
  conflict = false,
  undoState = null,
  pendingRestore = null,
  restoreBase = null;
try {
  lastSaved = localStorage.getItem(STORAGE_KEY);
  requests = decodeRequests(lastSaved);
} catch {
  requests = initialRequests();
  conflict = true;
  showNotice(
    'Não foi possível ler os dados locais. Os exemplos estão disponíveis apenas nesta sessão. Exporte a sessão ou tente carregar a versão salva.'
  );
}
const filters = {
  query: '',
  status: 'all',
  priority: 'all',
  due: 'all',
  archived: false,
  sort: 'recent'
};
let view = 'list';

function persist() {
  if (conflict) return false;
  try {
    // Confere também antes de gravar: o evento storage pode ainda estar na fila.
    if (localStorage.getItem(STORAGE_KEY) !== lastSaved) {
      conflict = true;
      showNotice(
        'Outra aba alterou os dados. A gravação foi pausada; as mudanças desta sessão ainda podem ser exportadas.'
      );
      return false;
    }
    const next = toBackup(requests);
    localStorage.setItem(STORAGE_KEY, next);
    lastSaved = next;
    $('#storage-panel').hidden = true;
    return true;
  } catch {
    showNotice(
      'Não foi possível salvar no navegador. As alterações estão apenas nesta sessão. Exporte o backup JSON antes de sair.'
    );
    return false;
  }
}
function changed(next, message) {
  try {
    toBackup(next);
  } catch (error) {
    render();
    announce(error.message);
    return false;
  }
  undoState = requests;
  requests = next;
  const saved = persist();
  render();
  announce(
    message +
      (saved
        ? ' Salvo neste navegador.'
        : ' Apenas nesta sessão; exporte o backup JSON para preservar.')
  );
  return true;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function action(text, className, callback) {
  const button = element('button', className, text);
  button.type = 'button';
  button.addEventListener('click', callback);
  return button;
}
const dateLabel = (value) => value.split('-').reverse().join('/');
function requestRow(request) {
  const item = element('li', 'request-item');
  const content = element('div');
  const heading = element('div', 'request-title-row');
  heading.append(
    element('h3', '', request.title),
    element(
      'span',
      'priority-tag' + (request.priority === 'alta' ? ' high' : ''),
      'Prioridade ' + PRIORITIES[request.priority].toLowerCase()
    )
  );
  content.append(heading);
  if (request.description) content.append(element('p', 'request-description', request.description));
  const metadata = element('p', 'request-meta');
  metadata.append(element('span', 'category-tag', CATEGORIES[request.category]));
  if (request.dueDate)
    metadata.append(
      element(
        'span',
        isLate(request) ? 'deadline late' : 'deadline',
        `${isLate(request) ? 'Atrasada · ' : request.dueDate === todayKey() && request.status !== 'concluida' ? 'Hoje · ' : 'Prazo · '}${dateLabel(request.dueDate)}`
      )
    );
  else metadata.append(element('span', '', 'Sem prazo'));
  content.append(metadata);
  const controls = element('div', 'row-controls');
  const label = element('label', 'sr-only', 'Status de ' + request.title);
  const select = element('select', 'status-select');
  select.id = 'status-' + request.id;
  label.htmlFor = select.id;
  select.dataset.value = request.status;
  for (const [value, text] of Object.entries(STATUSES)) {
    const option = element('option', '', text);
    option.value = value;
    option.selected = request.status === value;
    select.append(option);
  }
  select.disabled = request.archived;
  select.addEventListener('change', () => {
    changed(updateStatus(requests, request.id, select.value), 'Status atualizado.');
    (document.getElementById('status-' + request.id) || $('#result-count')).focus();
  });
  const edit = action('Editar e detalhes', 'clear-button', () => openForm(request.id));
  edit.setAttribute('aria-label', 'Editar e detalhes de ' + request.title);
  const archive = action(request.archived ? 'Desarquivar' : 'Arquivar', 'clear-button', () => {
    changed(
      editRequest(
        requests,
        request.id,
        { archived: !request.archived },
        request.archived ? 'restaurada' : 'arquivada',
        request.archived ? 'Retornada à lista ativa.' : 'Movida para arquivadas.'
      ),
      request.archived ? 'Solicitação desarquivada.' : 'Solicitação arquivada.'
    );
    $('#result-count').focus();
  });
  archive.setAttribute(
    'aria-label',
    (request.archived ? 'Desarquivar ' : 'Arquivar ') + request.title
  );
  controls.append(label, select, edit, archive);
  item.append(content, controls);
  return item;
}
function render() {
  const counts = countRequests(requests);
  for (const node of document.querySelectorAll('[data-count]'))
    node.textContent = counts[node.dataset.count];
  for (const button of document.querySelectorAll('[data-status]')) {
    const active = button.dataset.status === filters.status;
    button.setAttribute('aria-pressed', active);
    button.classList.toggle('active', active);
  }
  for (const button of document.querySelectorAll('[data-due]')) {
    button.setAttribute('aria-pressed', button.dataset.due === filters.due);
    button.disabled = filters.archived;
  }
  $('#late-count').textContent = requests.filter((request) => isLate(request)).length;
  $('#today-count').textContent = requests.filter(
    (request) =>
      !request.archived && request.status !== 'concluida' && request.dueDate === todayKey()
  ).length;
  const visible = selectRequests(requests, filters);
  $('#result-count').textContent =
    `${visible.length} de ${requests.filter((request) => Boolean(request.archived) === filters.archived).length} solicitações ${filters.archived ? 'arquivadas' : 'ativas'} · ${filters.sort === 'due' ? 'prazo mais próximo' : 'mais recentes primeiro'}`;
  $('#result-count').tabIndex = -1;
  $('#requests-list').hidden = view !== 'list';
  $('#requests-board').hidden = view !== 'board';
  $('#requests-list').replaceChildren(...(view === 'list' ? visible.map(requestRow) : []));
  $('#requests-board').replaceChildren();
  if (view === 'board')
    for (const [status, name] of Object.entries(STATUSES)) {
      const column = element('section', 'kanban-column');
      const group = visible.filter((request) => request.status === status);
      column.setAttribute('aria-label', name);
      column.append(element('h3', '', `${name} · ${group.length}`));
      const list = element('ul', 'requests-list');
      list.append(...group.map(requestRow));
      column.append(list);
      if (!group.length)
        column.append(element('p', 'column-empty', 'Nenhuma solicitação nesta etapa.'));
      $('#requests-board').append(column);
    }
  $('#empty-state').hidden = visible.length > 0;
  $('#export-csv').disabled = !visible.length;
  $('#undo-action').hidden = !undoState;
}
$('#search').addEventListener('input', (event) => {
  filters.query = event.target.value;
  render();
});
$('#priority-filter').addEventListener('change', (event) => {
  filters.priority = event.target.value;
  render();
});
$('#sort-order').addEventListener('change', (event) => {
  filters.sort = event.target.value;
  render();
});
$('#show-archived').addEventListener('change', (event) => {
  filters.archived = event.target.checked;
  filters.due = 'all';
  render();
});
for (const button of document.querySelectorAll('[data-status]'))
  button.addEventListener('click', () => {
    filters.status = button.dataset.status;
    render();
  });
for (const button of document.querySelectorAll('[data-due]'))
  button.addEventListener('click', () => {
    filters.due = filters.due === button.dataset.due ? 'all' : button.dataset.due;
    render();
  });
for (const button of document.querySelectorAll('[data-view]'))
  button.addEventListener('click', () => {
    view = button.dataset.view;
    for (const choice of document.querySelectorAll('[data-view]'))
      choice.setAttribute('aria-pressed', choice === button);
    render();
  });
function clearFilters() {
  Object.assign(filters, {
    query: '',
    status: 'all',
    priority: 'all',
    due: 'all',
    archived: false
  });
  $('#search').value = '';
  $('#priority-filter').value = 'all';
  $('#show-archived').checked = false;
  render();
}
$('#clear-filters').addEventListener('click', clearFilters);
$('#empty-clear').addEventListener('click', () => {
  clearFilters();
  $('#search').focus();
});
const requestDialog = $('#request-dialog');
function openForm(id = '') {
  const current = requests.find((request) => request.id === id);
  $('#request-form').reset();
  $('#request-id').value = id;
  $('#form-error').textContent = '';
  $('#request-dialog-title').textContent = current
    ? 'Detalhes da solicitação'
    : 'O que precisa ser feito?';
  $('#save-request').textContent = current ? 'Salvar alterações' : 'Criar solicitação';
  if (current)
    for (const [name, value] of Object.entries({
      title: current.title,
      category: current.category,
      priority: current.priority,
      description: current.description,
      dueDate: current.dueDate
    }))
      $('#request-form').elements.namedItem(name).value = value;
  $('#history-section').hidden = !current;
  $('#request-history').replaceChildren();
  if (current) {
    $('#request-history').append(
      element(
        'li',
        '',
        `Criada em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(current.createdAt))}`
      )
    );
    for (const entry of [...(current.history || [])].reverse())
      $('#request-history').append(
        element(
          'li',
          '',
          `${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(entry.at))} · ${entry.detail}`
        )
      );
  }
  requestDialog.showModal();
}
$('#new-request').addEventListener('click', () => openForm());
for (const selector of ['#close-dialog', '#cancel-dialog'])
  $(selector).addEventListener('click', () => requestDialog.close());
$('#request-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const data = new FormData(event.target);
    const id = $('#request-id').value;
    const fields = {
      title: data.get('title'),
      category: data.get('category'),
      priority: data.get('priority'),
      description: data.get('description'),
      dueDate: data.get('dueDate')
    };
    let next;
    if (id) next = editRequest(requests, id, fields);
    else {
      if (requests.length >= MAX_REQUESTS)
        throw new Error(
          'Limite de 500 solicitações. Salve um backup antes de restaurar os exemplos.'
        );
      const now = new Date().toISOString();
      const request = validateRequest({
        ...fields,
        id:
          'local-' +
          Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) =>
            value.toString(16)
          ).join('-'),
        status: 'aberta',
        createdAt: now,
        history: [{ action: 'criada', at: now, detail: 'Solicitação criada.' }]
      });
      next = [request, ...requests];
    }
    if (!changed(next, id ? 'Solicitação atualizada.' : 'Solicitação criada.')) return;
    clearFilters();
    requestDialog.close();
    $('#result-count').focus();
  } catch (error) {
    $('#form-error').textContent = error.message;
  }
});
function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = element('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#export-csv').addEventListener('click', () => {
  download(
    toCsv(selectRequests(requests, filters)),
    'fluxo-solicitacoes.csv',
    'text/csv;charset=utf-8'
  );
  announce('CSV gerado com o filtro atual.');
});
function exportSession() {
  try {
    download(toBackup(requests), 'fluxo-backup.json', 'application/json');
    announce('Backup JSON gerado com todas as solicitações e o histórico local.');
  } catch (error) {
    announce(error.message);
  }
}
$('#export-json').addEventListener('click', exportSession);
$('#conflict-export').addEventListener('click', exportSession);
$('#import-json').addEventListener('click', () => $('#backup-file').click());
$('#backup-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new Error('O arquivo deve ter até 2 MB.');
    const base = requests;
    const parsed = fromBackup(await file.text());
    if (base !== requests)
      throw new Error('A sessão mudou durante a leitura. Selecione o arquivo novamente.');
    pendingRestore = parsed;
    restoreBase = requests;
    $('#restore-summary').textContent =
      `${parsed.length} solicitações válidas · ${parsed.filter((request) => request.archived).length} arquivadas. O histórico e os prazos serão recuperados.`;
    $('#restore-dialog').showModal();
  } catch (error) {
    announce('Backup não carregado: ' + error.message);
  }
});
$('#cancel-restore').addEventListener('click', () => $('#restore-dialog').close());
$('#restore-dialog').addEventListener('close', () => {
  pendingRestore = null;
  restoreBase = null;
});
$('#confirm-restore').addEventListener('click', () => {
  if (!pendingRestore || requests !== restoreBase) {
    announce('A sessão mudou. Selecione o arquivo novamente.');
    $('#restore-dialog').close();
    return;
  }
  changed(pendingRestore, 'Backup recuperado.');
  clearFilters();
  $('#restore-dialog').close();
});
$('#undo-action').addEventListener('click', () => {
  if (!undoState) return;
  requests = undoState;
  undoState = null;
  const saved = persist();
  render();
  announce(
    'Última alteração desfeita.' +
      (saved ? ' Salvo neste navegador.' : ' Apenas nesta sessão; exporte o backup JSON.')
  );
});
const resetDialog = $('#reset-dialog');
let resetExpected = null;
$('#reset-demo').addEventListener('click', () => {
  try {
    resetExpected = localStorage.getItem(STORAGE_KEY);
  } catch {
    resetExpected = undefined;
  }
  resetDialog.showModal();
});
$('#cancel-reset').addEventListener('click', () => resetDialog.close());
$('#confirm-reset').addEventListener('click', () => {
  try {
    if (resetExpected !== undefined && localStorage.getItem(STORAGE_KEY) !== resetExpected) {
      conflict = true;
      showNotice(
        'Outra aba alterou os dados durante a confirmação. A restauração dos exemplos foi cancelada.'
      );
      resetDialog.close();
      return;
    }
    if (resetExpected !== undefined) {
      lastSaved = resetExpected;
      conflict = false;
    }
  } catch {
    /* A sessão continua utilizável se o armazenamento estiver bloqueado. */
  }
  changed(initialRequests(), 'Exemplos restaurados.');
  clearFilters();
  resetDialog.close();
});
$('#conflict-load').addEventListener('click', () => $('#load-dialog').showModal());
$('#cancel-load').addEventListener('click', () => $('#load-dialog').close());
$('#confirm-load').addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = decodeRequests(raw);
    requests = parsed;
    lastSaved = raw;
    conflict = false;
    undoState = null;
    $('#storage-panel').hidden = true;
    $('#load-dialog').close();
    requestDialog.close();
    clearFilters();
    announce('Versão salva carregada.');
  } catch {
    announce('A versão salva não pôde ser lida. A sessão atual foi preservada.');
    $('#load-dialog').close();
  }
});
window.addEventListener('storage', (event) => {
  if (event.storageArea === localStorage && (event.key === STORAGE_KEY || event.key === null)) {
    conflict = true;
    showNotice(
      'Outra aba alterou os dados. A gravação foi pausada. Exporte a sessão ou carregue a versão salva para continuar.'
    );
  }
});
$('#start-guide').addEventListener('click', () => {
  $('#guide-steps').hidden = false;
  $('#start-guide').hidden = true;
  $('#guide-create').focus();
});
$('#close-guide').addEventListener('click', () => {
  $('#guide-steps').hidden = true;
  $('#start-guide').hidden = false;
  $('#start-guide').focus();
});
$('#guide-create').addEventListener('click', () => {
  openForm();
  $('#request-title').value = 'Preparar checklist de exemplo';
  $('#request-description').value = 'Exemplo guiado: organizar os materiais e conferir a entrega.';
  $('#request-due').value = todayKey();
});
// Mantém os indicadores de prazo corretos se a página atravessar a meia-noite.
window.addEventListener('focus', () => {
  if (!requestDialog.open) render();
});
render();
if (new URLSearchParams(location.search).get('guia') === '1') $('#start-guide').click();
