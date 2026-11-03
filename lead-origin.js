export const RESPONSAVEIS = Object.freeze({
  FK: 'Fabio Krankel',
  SA: 'Sandra Araujo',
  AC: 'Alessandro Cita',
  PR: 'Patricia Ruani',
  CA: 'Cristina Amorim',
  FM: 'Fernanda Mello'
});
export function normalizeOrigin(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return Object.hasOwn(RESPONSAVEIS, code) ? code : null;
}
export function resolveOrigin(search, storage) {
  const params = new URLSearchParams(search);
  const key = 'ccipra.origem';
  if (params.has('o')) {
    const code = normalizeOrigin(params.get('o'));
    try { if (code) storage?.setItem(key, code); else storage?.removeItem(key); } catch {}
    return code;
  }
  try { return normalizeOrigin(storage?.getItem(key)); } catch { return null; }
}
export function getResponsible(code) {
  const normalized = normalizeOrigin(code);
  return normalized ? { codigo: normalized, nome: RESPONSAVEIS[normalized] } : null;
}
