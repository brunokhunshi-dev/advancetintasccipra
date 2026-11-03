export class InputError extends Error {}
const allowed = new Set(['nome', 'celular', 'email', 'empresa', 'produto', 'solicitaAmostra', 'mensagem', 'website', 'envioId']);
export function validateLead(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !allowed.has(key))) throw new InputError();
  function field(key, max, min = 0) {
    if (input[key] == null && !min) return null;
    if (typeof input[key] !== 'string') throw new InputError();
    const value = input[key].trim();
    if (value.length < min || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new InputError();
    return value || null;
  }
  const nome = field('nome', 120, 2);
  const email = field('email', 254, 3).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError();
  const phone = field('celular', 32, 8);
  if (!/^[+\d\s().-]+$/.test(phone)) throw new InputError();
  let digits = phone.replace(/\D/g, '');
  if (!phone.startsWith('+') && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`;
  if (digits.length < 10 || digits.length > 15 || digits.startsWith('0')) throw new InputError();
  if (typeof input.solicitaAmostra !== 'boolean') throw new InputError();
  const envioId = field('envioId', 36, 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(envioId)) throw new InputError();
  return { envioId, honeypot: Boolean(field('website', 200)), lead: {
    nome, celular: `+${digits}`, email, empresa: field('empresa', 160), produto: field('produto', 160),
    solicitaAmostra: input.solicitaAmostra, mensagem: field('mensagem', 3000)
  } };
}
export function nextLimits(previous = {}, now) {
  const windowStart = Math.floor(now / 600000) * 600000;
  const day = Math.floor(now / 86400000);
  const shortCount = previous.windowStart === windowStart ? previous.shortCount || 0 : 0;
  const dayCount = previous.day === day ? previous.dayCount || 0 : 0;
  if (shortCount >= 5 || dayCount >= 20) return null;
  return { windowStart, day, shortCount: shortCount + 1, dayCount: dayCount + 1 };
}
