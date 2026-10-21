import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app-check.js';

const form = document.getElementById('contact-form');
const button = form?.querySelector('button[type="submit"]');
const status = document.getElementById('contact-status');
let appCheck;
let pending;
function getAppCheck() {
    if (!appCheck) {
        const app = initializeApp({
            apiKey: 'AIzaSyDvYmXtMjd9g9rqFokzSGD_wGlP4lODILI',
            authDomain: 'captura-de-leads---ccipra-2026.firebaseapp.com',
            projectId: 'captura-de-leads---ccipra-2026',
            messagingSenderId: '932687327882',
            appId: '1:932687327882:web:37dd2e5922d7ead39db373'
        });
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider('6LcWafotAAAAAJUMnmqJvOy3BWCv0She-Dw27x1A'),
            isTokenAutoRefreshEnabled: true
        });
    }
    return appCheck;
}
form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
        nome: data.get('nome'), celular: data.get('celular'), email: data.get('email'),
        empresa: data.get('empresa'), produto: data.get('produto'),
        solicitaAmostra: data.has('amostra'), mensagem: data.get('mensagem'), website: data.get('website') || ''
    };
    const fingerprint = JSON.stringify(payload);
    // Preserva o identificador em falha de rede para não duplicar uma gravação já concluída.
    if (!pending || pending.fingerprint !== fingerprint) pending = { fingerprint, id: crypto.randomUUID() };
    button.disabled = true;
    button.textContent = 'Enviando…';
    status.textContent = '';
    try {
        const { token } = await getToken(getAppCheck());
        const response = await fetch('/api/leads', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Firebase-AppCheck': token },
            body: JSON.stringify({ ...payload, envioId: pending.id }),
            signal: AbortSignal.timeout(20000)
        });
        const result = await response.json();
        if (!response.ok || !result.sucesso) throw new Error(result.mensagem || 'Não foi possível enviar agora. Tente novamente.');
        status.textContent = 'Mensagem enviada! Nossa equipe entrará em contato.';
        form.reset(); pending = null;
    } catch (error) {
        status.textContent = error instanceof Error && !error.code && error.name === 'Error'
            ? error.message : 'Não foi possível concluir o envio. Verifique sua conexão e tente novamente.';
    } finally {
        button.disabled = false;
        button.textContent = 'Enviar';
    }
});
