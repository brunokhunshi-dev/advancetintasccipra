import test from 'node:test';
import assert from 'node:assert/strict';
import {makeViewer,serializeLead} from '../lib/lead-viewer.js';
const password='a'.repeat(40);
test('consulta exige segredo forte e não chama banco antes da autorização',async()=>{
 let reads=0;const handler=makeViewer({password,list:async()=>{reads++;return [];}});
 for(const token of ['', 'Bearer errado'])assert.equal((await handler(new Request('https://example.com',{headers:{Authorization:token}}))).status,401);
 assert.equal(reads,0);
 const response=await handler(new Request('https://example.com',{headers:{Authorization:'Bearer '+password}}));
 assert.equal(response.status,200);assert.equal(reads,1);assert.match(response.headers.get('cache-control'),/no-store/);
 assert.equal((await makeViewer({password:'fraca',list:async()=>{reads++;}})(new Request('https://example.com'))).status,503);
 assert.equal(reads,1);
 assert.equal((await handler(new Request('https://example.com',{method:'POST'}))).status,405);
});
test('somente campos do contato saem na resposta',()=>{
 const lead=serializeLead({id:'id',data:()=>({nome:'Nome',email:'email@example.com',celular:'123',mensagem:'<script>teste</script>',solicitaAmostra:true,criadoEm:{toDate:()=>new Date('2026-10-22')},segredo:'nao-expor',ip:'nao-expor',origem:{campanha:'ccipra'}})});
 assert.equal(lead.segredo,undefined);assert.equal(lead.ip,undefined);assert.equal(lead.solicitaAmostra,true);assert.equal(lead.mensagem,'<script>teste</script>');
});
