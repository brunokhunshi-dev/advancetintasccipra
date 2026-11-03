import { InputError, validateLead } from './lead-validation.js';
const reply = (status, message, extra = {}) => Response.json({ sucesso: status === 200, ...(message ? { mensagem: message } : {}) }, {
  status, headers: { 'Cache-Control': 'no-store', ...extra }
});
export function makeHandler({ verify, save, getIp, origins }) {
  return async request => {
    if (request.method !== 'POST') return reply(405, 'Método não permitido.', { Allow: 'POST' });
    if (!origins.includes(request.headers.get('origin'))) return reply(403, 'Origem não autorizada.');
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, 'Formato inválido.');
    const token = request.headers.get('x-firebase-appcheck');
    if (!token || token.length > 8192) return reply(401, 'Não foi possível verificar o envio. Atualize a página.');
    let data;
    try {
      if (Number(request.headers.get('content-length')) > 16384) return reply(413, 'Conteúdo muito grande.');
      const reader = request.body?.getReader();
      if (!reader) throw new InputError();
      const chunks = []; let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) { await reader.cancel(); return reply(413, 'Conteúdo muito grande.'); }
        chunks.push(Buffer.from(value));
      }
      data = validateLead(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch { return reply(400, 'Confira os campos do formulário.'); }
    try { await verify(token); } catch { return reply(401, 'Não foi possível verificar o envio. Atualize a página.'); }
    if (data.honeypot) return reply(200);
    try {
      const ip = getIp(request);
      if (!ip) return reply(503, 'Envio indisponível. Tente novamente mais tarde.');
      await save(data, ip);
      return reply(200);
    } catch (error) {
      if (error.code === 'RATE_LIMIT') return reply(429, 'Limite de envios atingido. Tente novamente mais tarde.', { 'Retry-After': '600' });
      // Não registrar payload, contato, IP, token ou mensagem de erro do SDK.
      console.error('lead_save_failed');
      return reply(503, 'Não foi possível enviar agora. Tente novamente.');
    }
  };
}
