import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, nextLimits } from '../lib/lead-validation.js';
import { makeHandler } from '../lib/lead-handler.js';
const payload = { nome:'Bruno Souza', celular:'(19) 99999-9999', email:'BRUNO@example.com', empresa:'Advance', produto:'Epóxi', solicitaAmostra:true, mensagem:'Consulta', website:'', envioId:'12345678-1234-4234-8234-123456789abc' };
const origin = 'https://advancetintasccipra.vercel.app';
const request = (data = payload, headers = {}) => new Request(`${origin}/api/leads`, { method:'POST', headers:{ origin, 'content-type':'application/json', 'x-firebase-appcheck':'valid', ...headers }, body:JSON.stringify(data) });
test('normaliza dados e rejeita campos internos e formatos inválidos', () => {
 const {lead} = validateLead(payload); assert.equal(lead.celular,'+5519999999999'); assert.equal(lead.email,'bruno@example.com');
 for (const data of [{...payload,status:'concluido'}, {...payload,nome:[]}, {...payload,email:'errado'}, {...payload,mensagem:'a'.repeat(3001)}, {...payload,solicitaAmostra:'true'}, {...payload,envioId:'../abc'}]) assert.throws(()=>validateLead(data));
});
test('limite por janela e dia sem depender de memória da função',()=>{
 let state;const now=1800000000000;
 for(let i=0;i<5;i++) state=nextLimits(state,now);
 assert.equal(nextLimits(state,now),null);
 assert.ok(nextLimits(state,now+600000));
 assert.equal(nextLimits({day:Math.floor(now/86400000),dayCount:20},now),null);
});
test('bloqueia origem, token ausente e token inválido antes da gravação',async()=>{
 let saves=0;
 const handler=makeHandler({origins:[origin],getIp:()=> '127.0.0.1',verify:async t=>{if(t!=='valid')throw Error();},save:async()=>{saves++;}});
 assert.equal((await handler(request(payload,{origin:'https://evil.example'}))).status,403);
 assert.equal((await handler(request(payload,{'x-firebase-appcheck':''}))).status,401);
 assert.equal((await handler(request(payload,{'x-firebase-appcheck':'invalid'}))).status,401);
 assert.equal(saves,0);
 assert.equal((await handler(request())).status,200);assert.equal(saves,1);
});
test('honeypot não grava; payload grande, inválido e limite têm erros seguros',async()=>{
 let saves=0;
 const handler=makeHandler({origins:[origin],getIp:()=> '127.0.0.1',verify:async()=>{},save:async()=>{saves++;throw Object.assign(Error('secret'),{code:'RATE_LIMIT'});}});
 assert.equal((await handler(request({...payload,website:'spam'}))).status,200); assert.equal(saves,0);
 assert.equal((await handler(request({...payload,mensagem:'a'.repeat(20000)}))).status,413);
 assert.equal((await handler(request({...payload,status:'admin'}))).status,400);
 const res=await handler(request());assert.equal(res.status,429);assert.ok(!(await res.text()).includes('secret'));
});
