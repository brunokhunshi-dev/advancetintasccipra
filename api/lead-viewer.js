import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { makeViewer, serializeLead } from '../lib/lead-viewer.js';
const projectId='captura-de-leads---ccipra-2026';
export async function GET(request) {
  return makeViewer({
    password:process.env.LEAD_VIEWER_PASSWORD,
    async list() {
      const credential=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
      if(credential.project_id!==projectId) throw new Error('configuration');
      const app=getApps().find(app=>app.name==='lead-viewer') || initializeApp({credential:cert(credential),projectId},'lead-viewer');
      const snapshot=await getFirestore(app).collection('leads').orderBy('criadoEm','desc').limit(50).get();
      return snapshot.docs.map(serializeLead);
    }
  })(request);
}
