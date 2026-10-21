import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { makeHandler } from '../lib/lead-handler.js';
import { nextLimits } from '../lib/lead-validation.js';
const projectId = 'captura-de-leads---ccipra-2026';
const appId = '1:932687327882:web:37dd2e5922d7ead39db373';
function services() {
  const secret = process.env.LEAD_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new Error('configuration');
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  if (credential.project_id !== projectId) throw new Error('configuration');
  const app = getApps().find(app => app.name === 'leads') || initializeApp({ credential: cert(credential), projectId }, 'leads');
  return { app, db: getFirestore(app), secret };
}
const handler = makeHandler({
  origins: ['https://advancetintasccipra.vercel.app', ...(process.env.LEAD_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)],
  getIp(request) {
    // Vercel sobrescreve este cabeçalho. Não confiar em x-forwarded-for fornecido pelo visitante.
    const ip = request.headers.get('x-vercel-forwarded-for')?.trim();
    return ip && isIP(ip) ? ip : null;
  },
  async verify(token) {
    const { app } = services();
    const decoded = await getAppCheck(app).verifyToken(token);
    if (decoded.appId !== appId) throw new Error('app');
  },
  async save({ envioId, lead }, ip) {
    const { db, secret } = services();
    const key = createHmac('sha256', secret).update(ip).digest('hex');
    const leadRef = db.collection('leads').doc(envioId);
    const limitRef = db.collection('_leadLimits').doc(key);
    const globalRef = db.collection('_leadLimits').doc('global');
    const now = Date.now(); const day = Math.floor(now / 86400000);
    await db.runTransaction(async tx => {
      const [existing, limits, global] = await tx.getAll(leadRef, limitRef, globalRef);
      if (existing.exists) return; // Repetir o mesmo envio não cria outro lead.
      const next = nextLimits(limits.data(), now);
      const globalCount = global.data()?.day === day ? global.data().count : 0;
      if (!next || globalCount >= 1000) { const error = new Error('limit'); error.code = 'RATE_LIMIT'; throw error; }
      tx.set(limitRef, { ...next, atualizadoEm: FieldValue.serverTimestamp() });
      tx.set(globalRef, { day, count: globalCount + 1 });
      tx.create(leadRef, {
        ...lead, schemaVersion: 1,
        origem: { canal: 'landing_page', campanha: 'ccipra', formularioVersao: '1' },
        privacidade: { avisoVersao: '1', politicaUrl: 'https://advancetintas.com.br/politica-de-privacidade' },
        status: 'novo', responsavelUid: null,
        criadoEm: FieldValue.serverTimestamp(), atualizadoEm: FieldValue.serverTimestamp()
      });
    });
  }
});
export async function POST(request) { return handler(request); }
export async function GET(request) { return handler(request); }
export async function OPTIONS(request) { return handler(request); }
