import { getResponsible } from '../lead-origin.js';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { makeHandler } from '../lib/lead-handler.js';
import { nextGlobalLimit } from '../lib/lead-validation.js';
const projectId = 'ccipra-leads';
function services() {
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  if (credential.project_id !== projectId) throw new Error('configuration');
  const app = getApps().find(app => app.name === 'leads') || initializeApp({ credential: cert(credential), projectId }, 'leads');
  return { app, db: getFirestore(app) };
}
const handler = makeHandler({
  origins: ['https://advancetintasccipra.vercel.app', ...(process.env.LEAD_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)],
  async save({ envioId, lead, origemCodigo }) {
    const { db } = services();
    const leadRef = db.collection('leads').doc(envioId);
    const globalRef = db.collection('_leadLimits').doc('global');
    const now = Date.now();
    await db.runTransaction(async tx => {
      const [existing, global] = await tx.getAll(leadRef, globalRef);
      if (existing.exists) return; // Repetir o mesmo envio não cria outro lead.
      const next = nextGlobalLimit(global.data(), now);
      if (!next) { const error = new Error('limit'); error.code = 'RATE_LIMIT'; throw error; }
      tx.set(globalRef, next);
      tx.create(leadRef, {
        ...lead, schemaVersion: 1,
        origem: { canal: 'landing_page', campanha: 'ccipra', formularioVersao: '1', responsavel: getResponsible(origemCodigo) },
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
