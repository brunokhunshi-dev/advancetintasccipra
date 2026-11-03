import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, nextGlobalLimit } from '../lib/lead-validation.js';
import { makeHandler } from '../lib/lead-handler.js';
const payload = { nome:'Bruno Souza', celular:'(19) 99999-9999', email:'BRUNO@example.com', empresa:'Advance', produto:'Adzinc 9500', solicitaAmostra:true, mensagem:'Consulta', website:'', envioId:'12345678-1234-4234-8234-123456789abc' };
const origin = 'https://advancetintasccipra.vercel.app';
const request = (data = payload, headers = {}) => new Request(`${origin}/api/leads`, { method:'POST', headers:{ origin, 'content-type':'application/json', 'x-firebase-appcheck':'valid', ...headers }, body:JSON.stringify(data) });
test('normaliza dados e rejeita campos internos e formatos inválidos', () => {
 const {lead} = validateLead(payload); assert.equal(lead.celular,'+5519999999999'); assert.equal(lead.email,'bruno@example.com');
 for (const data of [{...payload,status:'concluido'}, {...payload,nome:[]}, {...payload,email:'errado'}, {...payload,mensagem:'a'.repeat(3001)}, {...payload,solicitaAmostra:'true'}, {...payload,envioId:'../abc'}]) assert.throws(()=>validateLead(data));
});
test('mantém somente o limite global de 1000 por dia UTC',()=>{
 const now=1800000000000;
 let state;
 for(let i=0;i<1000;i++) { state=nextGlobalLimit(state,now); assert.equal(state.count,i+1); }
 assert.equal(nextGlobalLimit(state,now),null);
 assert.equal(nextGlobalLimit(state,now+86400000).count,1);
});
test('bloqueia origem, token ausente e token inválido antes da gravação',async()=>{
 let saves=0;
 const handler=makeHandler({origins:[origin],verify:async t=>{if(t!=='valid')throw Error();},save:async()=>{saves++;}});
 assert.equal((await handler(request(payload,{origin:'https://evil.example'}))).status,403);
 assert.equal((await handler(request(payload,{'x-firebase-appcheck':''}))).status,401);
 assert.equal((await handler(request(payload,{'x-firebase-appcheck':'invalid'}))).status,401);
 assert.equal(saves,0);
 assert.equal((await handler(request())).status,200);assert.equal(saves,1);
});
test('honeypot não grava; payload grande, inválido e limite têm erros seguros',async()=>{
 let saves=0;
 const handler=makeHandler({origins:[origin],verify:async()=>{},save:async()=>{saves++;throw Object.assign(Error('secret'),{code:'RATE_LIMIT'});}});
 assert.equal((await handler(request({...payload,website:'spam'}))).status,200); assert.equal(saves,0);
 assert.equal((await handler(request({...payload,mensagem:'a'.repeat(20000)}))).status,413);
 assert.equal((await handler(request({...payload,status:'admin'}))).status,400);
 const res=await handler(request());assert.equal(res.status,429);assert.ok(!(await res.text()).includes('secret'));
});


test('Firebase Admin carrega sem require(ESM), como no runtime que apresentou falha', async () => {
 const { spawnSync } = await import('node:child_process');
 const result = spawnSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', "await import('firebase-admin/app-check'); await import('firebase-admin/firestore'); await import('./api/leads.js');"], { cwd:process.cwd(), encoding:'utf8' });
 assert.equal(result.status,0,result.stderr);
});

test('produto aceita opções cadastradas ou null', () => {
 for (const produto of ["Adzinc 9500","Ecovance Epoxy HDF 3500","Ecovance Epoxy WST","Outro"]) assert.equal(validateLead({...payload, produto}).lead.produto, produto);
 for (const produto of ['', '   ', undefined, null]) assert.equal(validateLead({...payload, produto}).lead.produto, null);
 for (const produto of ['Produto inventado', 'Adzinc', 'Econvance Epoxy HDF 3500']) assert.throws(() => validateLead({...payload, produto}));
});

test('aceita mais de 20 envios sem consultar nem exigir IP',async()=>{
 let saves=0;
 const handler=makeHandler({origins:[origin],verify:async()=>{},getIp:()=>{throw Error('IP não deve ser consultado');},save:async()=>{saves++;}});
 for(let i=0;i<25;i++) assert.equal((await handler(request())).status,200);
 assert.equal(saves,25);
});
