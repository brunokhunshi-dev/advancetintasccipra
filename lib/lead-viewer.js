import { createHash, timingSafeEqual } from 'node:crypto';
const headers = { 'Cache-Control':'private, no-store, max-age=0', 'Vary':'Authorization', 'X-Content-Type-Options':'nosniff' };
const reply = (status, body) => Response.json(body, {status, headers});
export function makeViewer({ password, list }) {
  return async request => {
    if (request.method !== 'GET') return reply(405,{mensagem:'Método não permitido.'});
    if (typeof password !== 'string' || password.length < 32) return reply(503,{mensagem:'O acesso ao visualizador ainda não foi configurado.'});
    const auth = request.headers.get('authorization') || '';
    const candidate = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!candidate || candidate.length > 512 || !timingSafeEqual(createHash('sha256').update(candidate).digest(),createHash('sha256').update(password).digest())) {
      return reply(401,{mensagem:'Senha de acesso inválida.'});
    }
    try { return reply(200,{ leads:await list(), consultadoEm:new Date().toISOString(), limite:50 }); }
    catch { console.error('lead_viewer_read_failed'); return reply(503,{mensagem:'Não foi possível consultar os dados. Tente novamente.'}); }
  };
}
export function serializeLead(doc) {
  const data=doc.data();
  const text = (v,max) => typeof v==='string' ? v.slice(0,max) : null;
  const date = v => typeof v?.toDate === 'function' ? v.toDate().toISOString() : null;
  return { id:doc.id, nome:text(data.nome,120), celular:text(data.celular,32), email:text(data.email,254),
    empresa:text(data.empresa,160), produto:text(data.produto,160), solicitaAmostra:data.solicitaAmostra===true,
    mensagem:text(data.mensagem,3000), criadoEm:date(data.criadoEm), campanha:text(data.origem?.campanha,80) };
}
