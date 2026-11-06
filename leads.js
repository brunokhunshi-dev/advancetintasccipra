import { resolveOrigin } from './lead-origin.js?v=1';

let session;
try { session = window.sessionStorage; } catch {}
const origemCodigo = resolveOrigin(window.location.search, session);
const form = document.getElementById('contact-form');
const button = form?.querySelector('button[type="submit"]');
const status = document.getElementById('contact-status');
let pending;
function showStatus(message) {
    status.textContent = message;
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
        origemCodigo,
        nome: data.get('nome'), celular: data.get('celular'), email: data.get('email'),
        empresa: data.get('empresa'), produto: data.get('produto') || null,
        solicitaAmostra: data.has('amostra'), mensagem: data.get('mensagem'), website: data.get('website') || ''
    };
    const fingerprint = JSON.stringify(payload);
    // Preserva o identificador em falha de rede para não duplicar uma gravação já concluída.
    if (!pending || pending.fingerprint !== fingerprint) pending = { fingerprint, id: crypto.randomUUID() };
    button.disabled = true;
    button.textContent = 'Enviando…';
    try {
        showStatus('Enviando sua mensagem…');
        const response = await fetch('/api/leads', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, envioId: pending.id }),
            signal: AbortSignal.timeout(20000)
        });
        const result = await response.json().catch(() => { throw new Error('O serviço de envio está indisponível. Tente novamente mais tarde.'); });
        if (!response.ok || !result.sucesso) throw new Error(result.mensagem || 'Não foi possível enviar agora. Tente novamente.');
        showStatus('Mensagem enviada! Nossa equipe entrará em contato.');
        form.reset(); pending = null;
    } catch (error) {
        const code = typeof error?.code === 'string' ? error.code : '';
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            showStatus('O envio demorou demais. Tente novamente; sua solicitação não será duplicada.');
        } else {
            showStatus(error instanceof Error && !code && error.name === 'Error'
                ? error.message : 'Não foi possível concluir o envio. Verifique sua conexão e tente novamente.');
        }
        // Somente código técnico: não registrar conteúdo do formulário ou credenciais.
        console.error('lead_submission_failed', code || error.name || 'unknown');
    } finally {
        button.disabled = false;
        button.textContent = 'Enviar';
    }
});
