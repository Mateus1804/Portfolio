export const STORAGE_KEY = 'mw:fluxo:v1';
export const MAX_REQUESTS = 500;
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
export const SCHEMA_VERSION = 2;
export const STATUSES = Object.freeze({
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluída'
});
export const PRIORITIES = Object.freeze({ normal: 'Normal', alta: 'Alta' });
export const CATEGORIES = Object.freeze({
  operacao: 'Operação',
  comunicacao: 'Comunicação',
  tecnologia: 'Tecnologia'
});

export function initialRequests() {
  return [
    {
      id: 'demo-006',
      title: 'Conferir checklist de abertura',
      category: 'operacao',
      priority: 'alta',
      status: 'aberta',
      description: 'Exemplo fictício: revisar as etapas para iniciar a operação de uma unidade.',
      createdAt: '2026-10-20T13:00:00.000Z'
    },
    {
      id: 'demo-005',
      title: 'Preparar arte para painel informativo',
      category: 'comunicacao',
      priority: 'normal',
      status: 'em_andamento',
      description: 'Exemplo fictício de acompanhamento de uma peça de comunicação.',
      createdAt: '2026-10-19T11:30:00.000Z'
    },
    {
      id: 'demo-004',
      title: 'Agendar troca de terminal',
      category: 'tecnologia',
      priority: 'alta',
      status: 'aberta',
      description: 'Exemplo fictício, sem dados de equipamentos ou fornecedores reais.',
      createdAt: '2026-10-18T16:00:00.000Z'
    },
    {
      id: 'demo-003',
      title: 'Revisar controle semanal de demandas',
      category: 'operacao',
      priority: 'normal',
      status: 'aberta',
      description: 'Conferir os registros de exemplo e atualizar o andamento.',
      createdAt: '2026-10-17T12:15:00.000Z'
    },
    {
      id: 'demo-002',
      title: 'Organizar materiais de comunicação',
      category: 'comunicacao',
      priority: 'normal',
      status: 'concluida',
      description: 'Exemplo fictício de uma demanda finalizada.',
      createdAt: '2026-10-16T14:00:00.000Z'
    },
    {
      id: 'demo-001',
      title: 'Atualizar roteiro de atendimento',
      category: 'operacao',
      priority: 'normal',
      status: 'concluida',
      description: 'Exemplo fictício de documentação de um processo.',
      createdAt: '2026-10-15T09:00:00.000Z'
    }
  ].map((request, index) =>
    validateRequest({
      ...request,
      dueDate: index < 3 ? dateOffset(index - 1) : '',
      archived: false,
      history: []
    })
  );
}

const hasOwn = (object, key) => Object.hasOwn(object, key);
export function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function validateRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Solicitação inválida.');
  if (typeof value.id !== 'string' || !/^[\w-]{1,80}$/.test(value.id))
    throw new Error('Identificador inválido.');
  if (
    typeof value.title !== 'string' ||
    value.title.trim().length < 3 ||
    value.title.trim().length > 80
  )
    throw new Error('O título deve ter entre 3 e 80 caracteres.');
  if (
    !hasOwn(CATEGORIES, value.category) ||
    !hasOwn(PRIORITIES, value.priority) ||
    !hasOwn(STATUSES, value.status)
  )
    throw new Error('Selecione valores válidos nos campos da solicitação.');
  if (typeof value.description !== 'string' || value.description.length > 240)
    throw new Error('A descrição deve ter até 240 caracteres.');
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)))
    throw new Error('Data inválida.');
  const dueDate = value.dueDate ?? '';
  if (
    typeof dueDate !== 'string' ||
    (dueDate &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        !Number.isFinite(Date.parse(dueDate + 'T12:00:00Z')) ||
        new Date(dueDate + 'T12:00:00Z').toISOString().slice(0, 10) !== dueDate))
  )
    throw new Error('Prazo inválido.');
  if (value.archived !== undefined && typeof value.archived !== 'boolean')
    throw new Error('Arquivamento inválido.');
  const history = value.history ?? [];
  if (!Array.isArray(history) || history.length > 100) throw new Error('Histórico inválido.');
  const validHistory = history.map((entry) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      !['criada', 'editada', 'status', 'arquivada', 'restaurada'].includes(entry.action) ||
      typeof entry.at !== 'string' ||
      !Number.isFinite(Date.parse(entry.at)) ||
      typeof entry.detail !== 'string' ||
      entry.detail.length > 300
    )
      throw new Error('Evento de histórico inválido.');
    return { action: entry.action, at: new Date(entry.at).toISOString(), detail: entry.detail };
  });
  return {
    dueDate,
    archived: value.archived ?? false,
    history: validHistory,
    id: value.id,
    title: value.title.trim(),
    category: value.category,
    priority: value.priority,
    status: value.status,
    description: value.description.trim(),
    createdAt: new Date(value.createdAt).toISOString()
  };
}

export function decodeRequests(raw) {
  if (raw === null) return initialRequests();
  const data = JSON.parse(raw);
  if (
    ![1, SCHEMA_VERSION].includes(data?.version) ||
    !Array.isArray(data.requests) ||
    data.requests.length > MAX_REQUESTS
  )
    throw new Error('Dados salvos incompatíveis com esta versão.');
  const requests = data.requests.map(validateRequest);
  if (new Set(requests.map((request) => request.id)).size !== requests.length)
    throw new Error('Há identificadores duplicados nos dados salvos.');
  return requests;
}

export function selectRequests(
  requests,
  {
    query = '',
    status = 'all',
    priority = 'all',
    due = 'all',
    archived = false,
    sort = 'recent',
    today = todayKey()
  } = {}
) {
  const normalizedQuery = normalizeText(query.trim());
  return requests
    .filter(
      (request) =>
        Boolean(request.archived) === archived &&
        (due === 'all' ||
          (due === 'late' && isLate(request, today)) ||
          (due === 'today' && request.dueDate === today && request.status !== 'concluida')) &&
        (status === 'all' || request.status === status) &&
        (priority === 'all' || request.priority === priority) &&
        normalizeText(
          `${request.title} ${request.description} ${CATEGORIES[request.category]}`
        ).includes(normalizedQuery)
    )
    .sort(
      (first, second) =>
        (sort === 'due' ? (first.dueDate || '9999').localeCompare(second.dueDate || '9999') : 0) ||
        Date.parse(second.createdAt) - Date.parse(first.createdAt) ||
        first.id.localeCompare(second.id)
    );
}

export function countRequests(requests) {
  return requests
    .filter((request) => !request.archived)
    .reduce(
      (counts, request) => {
        counts.all += 1;
        counts[request.status] += 1;
        return counts;
      },
      { all: 0, aberta: 0, em_andamento: 0, concluida: 0 }
    );
}

export function updateStatus(requests, id, status) {
  if (!hasOwn(STATUSES, status)) throw new Error('Status inválido.');
  if (!requests.some((request) => request.id === id))
    throw new Error('Solicitação não encontrada.');
  return editRequest(requests, id, { status }, 'status', `Status: ${STATUSES[status]}`);
}

function csvCell(value) {
  const text = String(value);
  // Planilhas podem interpretar fórmulas mesmo em células entre aspas.
  const safeText = /^[\s]*[=+\-@]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function toCsv(requests) {
  const lines = [
    ['Título', 'Categoria', 'Prioridade', 'Status', 'Descrição', 'Criada em', 'Prazo', 'Arquivada'],
    ...requests.map((request) => [
      request.title,
      CATEGORIES[request.category],
      PRIORITIES[request.priority],
      STATUSES[request.status],
      request.description,
      request.createdAt,
      request.dueDate || '',
      request.archived ? 'Sim' : 'Não'
    ])
  ];
  return '\uFEFF' + lines.map((line) => line.map(csvCell).join(',')).join('\r\n');
}

// Datas civis são comparadas como AAAA-MM-DD, sem deslocar o prazo pelo fuso.
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}
function dateOffset(days) {
  const date = new Date(todayKey() + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function isLate(request, today = todayKey()) {
  return (
    !request.archived &&
    request.status !== 'concluida' &&
    Boolean(request.dueDate) &&
    request.dueDate < today
  );
}
export function editRequest(
  requests,
  id,
  changes,
  action = 'editada',
  detail = 'Campos da solicitação atualizados.',
  now = new Date().toISOString()
) {
  const current = requests.find((request) => request.id === id);
  if (!current) throw new Error('Solicitação não encontrada.');
  // Identidade e criação nunca são alteradas por edição ou importadas do formulário.
  const allowed = {};
  for (const key of [
    'title',
    'description',
    'category',
    'priority',
    'dueDate',
    'status',
    'archived'
  ])
    if (Object.hasOwn(changes, key)) allowed[key] = changes[key];
  if (Object.entries(allowed).every(([key, value]) => current[key] === value)) return requests;
  const changed = validateRequest({
    ...current,
    ...allowed,
    history: [...(current.history || []), { action, at: now, detail }].slice(-100)
  });
  return requests.map((request) => (request.id === id ? changed : request));
}
export function toBackup(requests) {
  const validated = decodeRequests(JSON.stringify({ version: SCHEMA_VERSION, requests }));
  const raw = JSON.stringify({
    application: 'fluxo-solicitacoes',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    requests: validated
  });
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES)
    throw new Error(
      'O conjunto de dados atingiu o limite de 2 MB. Preserve um backup antes de reduzir os registros.'
    );
  return raw;
}
export function fromBackup(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES)
    throw new Error('O arquivo deve ter até 2 MB.');
  const parsed = JSON.parse(raw);
  if (parsed?.application !== 'fluxo-solicitacoes')
    throw new Error('Este arquivo não é um backup do Fluxo.');
  return decodeRequests(raw);
}
