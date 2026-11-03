import test from 'node:test';
import assert from 'node:assert/strict';
import { RESPONSAVEIS, normalizeOrigin, resolveOrigin, getResponsible } from '../lead-origin.js';
import { validateLead } from '../lib/lead-validation.js';
import { makeHandler } from '../lib/lead-handler.js';
const payload = { nome:'Teste', celular:'19999999999', email:'teste@example.com', produto:null, solicitaAmostra:false, envioId:'12345678-1234-4234-8234-123456789abc' };
test('seis códigos normalizados e nomes definidos no servidor', () => {
  assert.equal(Object.keys(RESPONSAVEIS).length, 6);
  for (const [codigo,nome] of Object.entries(RESPONSAVEIS)) {
    assert.equal(normalizeOrigin(codigo.toLowerCase()), codigo);
    assert.deepEqual(getResponsible(codigo), {codigo,nome});
    assert.equal(validateLead({...payload,origemCodigo:codigo}).origemCodigo,codigo);
  }
  for (const code of [null,undefined,'','XX','__proto__',{},'Sandra']) {
    assert.equal(normalizeOrigin(code),null);
    assert.equal(validateLead({...payload,origemCodigo:code}).origemCodigo,null);
  }
});
test('origem persiste na sessão, troca por novo link e limpa código inválido', () => {
  const map=new Map(), storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  assert.equal(resolveOrigin('',storage),null);
  assert.equal(resolveOrigin('?o=sa',storage),'SA');
  assert.equal(resolveOrigin('',storage),'SA');
  assert.equal(resolveOrigin('?o=FK',storage),'FK');
  assert.equal(resolveOrigin('',storage),'FK');
  assert.equal(resolveOrigin('?o=XX',storage),null);
  assert.equal(resolveOrigin('',storage),null);
  const blocked={getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}};
  assert.equal(resolveOrigin('?o=CA',blocked),'CA');
  assert.equal(resolveOrigin('',blocked),null);
});
test('API encaminha código validado para persistência junto com o formulário', async () => {
  let saved;
  const origin='https://advancetintasccipra.vercel.app';
  const handler=makeHandler({origins:[origin],verify:async()=>{},getIp:()=> '127.0.0.1',save:async data=>{saved=data;}});
  const res=await handler(new Request(origin+'/api/leads',{method:'POST',headers:{origin,'content-type':'application/json','x-firebase-appcheck':'test'},body:JSON.stringify({...payload,origemCodigo:'pr'})}));
  assert.equal(res.status,200);
  assert.deepEqual(getResponsible(saved.origemCodigo),{codigo:'PR',nome:'Patricia Ruani'});
});
