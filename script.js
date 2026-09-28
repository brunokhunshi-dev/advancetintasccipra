document.addEventListener('DOMContentLoaded', () => {
    const scrollIndicator = document.querySelector('.scroll-indicator');

let hasScrolled = false;

container.addEventListener('scroll', () => {
    if (!hasScrolled && container.scrollTop > 5) {
        hasScrolled = true;
        scrollIndicator.classList.add('hidden');
    }
}, { passive: true });
    console.log('Catálogo Advance inicializado com sucesso.');

    const container = document.querySelector('.mobile-app-container');
    const screens = document.querySelectorAll('.screen');

    const observerOptions = {
        root: container,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Adicionar classe para animações de entrada, se necessário
                // entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    screens.forEach(screen => observer.observe(screen));
});
