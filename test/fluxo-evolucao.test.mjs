import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRequests, validateRequest, decodeRequests, editRequest, selectRequests, countRequests, isLate, todayKey, toBackup, fromBackup, MAX_BACKUP_BYTES } from '../dist/demos/solicitacoes/model.js';
const sample = changes => validateRequest({ ...initialRequests()[0], ...changes });
test('migração v1 conserva identidade, criação e campos anteriores', () => {
  const old = { id:'old-1', title:'Demanda antiga', description:'Descrição', category:'operacao', priority:'normal', status:'aberta', createdAt:'2025-01-01T12:00:00Z' };
  const [migrated] = decodeRequests(JSON.stringify({ version:1, requests:[old] }));
  assert.equal(migrated.id, old.id); assert.equal(migrated.title, old.title); assert.equal(migrated.dueDate,''); assert.deepEqual(migrated.history,[]); assert.equal(migrated.archived,false);
});
test('prazos exigem datas civis existentes', () => {
  for (const dueDate of ['2026-02-29', '2026-04-31', '2026-00-15', 'hoje', 42]) assert.throws(() => sample({dueDate}));
  assert.equal(sample({ dueDate:'2028-02-29' }).dueDate,'2028-02-29');
});
test('o dia civil usa Brasília próximo à meia-noite UTC', () => {
  assert.equal(todayKey(new Date('2026-10-26T01:00:00Z')), '2026-10-25');
});
test('atraso ignora concluídas, arquivadas e registros sem prazo', () => {
  const r = sample({ dueDate:'2026-10-24' }); assert.equal(isLate(r,'2026-10-25'),true);
  for (const changes of [{status:'concluida'}, {archived:true}, {dueDate:''}]) assert.equal(isLate({...r,...changes},'2026-10-25'),false);
  assert.equal(isLate({...r,dueDate:'2026-10-25'},'2026-10-25'),false);
});
test('edição mantém identidade e data, registra histórico e não altera o original', () => {
  const r=sample({history:[]}); const [edited]=editRequest([r],r.id,{title:'Título atualizado',id:'outro',createdAt:'2000-01-01'});
  assert.equal(edited.id,r.id); assert.equal(edited.createdAt,r.createdAt); assert.equal(edited.history.length,1); assert.equal(r.history.length,0); assert.notEqual(r.title,edited.title);
});
test('edição sem mudanças não inventa evento de histórico', () => {
  const list=[sample({})]; assert.equal(editRequest(list,list[0].id,{title:list[0].title}),list);
});
test('histórico mantém somente os 100 eventos mais recentes', () => {
  let rows=[sample({history:[]})];
  for(let i=0;i<105;i++) rows=editRequest(rows,rows[0].id,{title:'Demanda '+i});
  assert.equal(rows[0].history.length,100); assert.equal(rows[0].title,'Demanda 104');
});
test('arquivadas ficam fora das contagens e podem ser recuperadas por filtro', () => {
  const r=sample({archived:true}); assert.equal(countRequests([r]).all,0);
  assert.equal(selectRequests([r]).length,0); assert.equal(selectRequests([r],{archived:true}).length,1);
});
test('filtros de prazo se combinam com status, busca e prioridade', () => {
  const rows=[sample({dueDate:'2026-10-24'}),sample({id:'hoje',dueDate:'2026-10-25'})];
  assert.equal(selectRequests(rows,{due:'late',today:'2026-10-25',priority:'alta',query:'checklist'}).length,1);
  assert.equal(selectRequests(rows,{due:'today',today:'2026-10-25'})[0].id,'hoje');
});
test('ordenar por prazo coloca ausência de prazo no final', () => {
  const rows=[sample({id:'sem',dueDate:''}),sample({id:'com',dueDate:'2026-11-01'})]; assert.equal(selectRequests(rows,{sort:'due'})[0].id,'com');
});
test('backup recupera inclusive arquivadas, prazos e histórico', () => {
  const rows=editRequest([sample({archived:true,dueDate:'2026-11-01'})],initialRequests()[0].id,{title:'Demanda atualizada'});
  assert.deepEqual(fromBackup(toBackup(rows)), rows);
});
test('backup rejeita aplicação errada, corrupção, campos inválidos e IDs duplicados', () => {
  const valid=JSON.parse(toBackup([sample({})]));
  for(const changes of [{application:'outro'}, {version:999}, {requests:[sample({}),sample({})]}, {requests:[{...sample({}),history:[{action:'invalida',at:'2026-01-01',detail:'Teste'}]}]}]) assert.throws(()=>fromBackup(JSON.stringify({...valid,...changes})));
  assert.throws(()=>fromBackup('{')); assert.throws(()=>fromBackup(' '.repeat(MAX_BACKUP_BYTES+1)));
});
test('campos de arquivamento e histórico inválidos não são aceitos',()=>{
  for(const changes of [{archived:'sim'},{history:{}},{history:[{action:'editada',at:'inválida',detail:'Teste'}]}]) assert.throws(()=>sample(changes));
});
test('exportação recusa um conjunto acima do limite recuperável sem alterar a origem',()=>{
  const history=Array.from({length:100},()=>({action:'editada',at:'2026-10-25T12:00:00.000Z',detail:'á'.repeat(300)}));
  const rows=Array.from({length:100},(_,index)=>sample({id:'limite-'+index,history}));
  assert.throws(()=>toBackup(rows),/limite de 2 MB/);assert.equal(rows.length,100);assert.equal(rows[0].history.length,100);
});
