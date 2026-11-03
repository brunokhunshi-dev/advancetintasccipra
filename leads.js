import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app-check.js';

const form = document.getElementById('contact-form');
const button = form?.querySelector('button[type="submit"]');
const status = document.getElementById('contact-status');
let appCheck;
let pending;
function withTimeout(promise, milliseconds) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error(), { code: 'appcheck-timeout' })), milliseconds);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
function showStatus(message) {
    status.textContent = message;
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
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
    showStatus('Verificando a segurança do envio…');
    try {
        const { token } = await withTimeout(getToken(getAppCheck()), 15000);
        showStatus('Enviando sua mensagem…');
        const response = await fetch('/api/leads', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Firebase-AppCheck': token },
            body: JSON.stringify({ ...payload, envioId: pending.id }),
            signal: AbortSignal.timeout(20000)
        });
        const result = await response.json().catch(() => { throw new Error('O serviço de envio está indisponível. Tente novamente mais tarde.'); });
        if (!response.ok || !result.sucesso) throw new Error(result.mensagem || 'Não foi possível enviar agora. Tente novamente.');
        showStatus('Mensagem enviada! Nossa equipe entrará em contato.');
        form.reset(); pending = null;
    } catch (error) {
        const code = typeof error?.code === 'string' ? error.code : '';
        if (code === 'appcheck-timeout') {
            showStatus('A verificação de segurança demorou demais. Atualize a página e tente novamente.');
        } else if (code.startsWith('appCheck/')) {
            showStatus('Não foi possível validar a segurança do formulário. Atualize a página e tente novamente.');
        } else if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            showStatus('O envio demorou demais. Tente novamente; sua solicitação não será duplicada.');
        } else {
            showStatus(error instanceof Error && !code && error.name === 'Error'
                ? error.message : 'Não foi possível concluir o envio. Verifique sua conexão e tente novamente.');
        }
        // Somente código técnico: não registrar token, conteúdo do formulário ou credenciais.
        console.error('lead_submission_failed', code || error.name || 'unknown');
    } finally {
        button.disabled = false;
        button.textContent = 'Enviar';
    }
});
