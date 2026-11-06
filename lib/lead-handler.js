import { InputError, validateLead } from './lead-validation.js';
const reply = (status, message, extra = {}) => Response.json({ sucesso: status === 200, ...(message ? { mensagem: message } : {}) }, {
  status, headers: { 'Cache-Control': 'no-store', ...extra }
});
export function makeHandler({ save, origins }) {
  return async request => {
    if (request.method !== 'POST') return reply(405, 'Método não permitido.', { Allow: 'POST' });
    if (!origins.includes(request.headers.get('origin'))) return reply(403, 'Origem não autorizada.');
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, 'Formato inválido.');
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
    if (data.honeypot) return reply(200);
    try {
      await save(data);
      return reply(200);
    } catch (error) {
      if (error.code === 'RATE_LIMIT') return reply(429, 'Limite de envios atingido. Tente novamente mais tarde.', { 'Retry-After': '600' });
      // Não registrar payload, contato, IP ou mensagem de erro do SDK.
      console.error('lead_save_failed');
      return reply(503, 'Não foi possível enviar agora. Tente novamente.');
    }
  };
}
