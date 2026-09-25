// O layout funciona majoritariamente com CSS (Scroll Snap e Flexbox).
// Este arquivo está pronto caso precise adicionar lógicas futuras, 
// como observar qual sessão está ativa para atualizar menus ou animações.

document.addEventListener("DOMContentLoaded", () => {
    console.log("Catálogo Advance inicializado com sucesso.");

    // Exemplo de Observer para detectar em qual tela o usuário está (opcional para animações)
    const screens = document.querySelectorAll('.screen');
    
    const observerOptions = {
        root: document.querySelector('.mobile-app-container'),
        threshold: 0.5 // Dispara quando 50% da tela está visível
    };

    const screenObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Aqui você pode adicionar classes para disparar animações CSS
                // entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    screens.forEach(screen => {
        screenObserver.observe(screen);
    });
});