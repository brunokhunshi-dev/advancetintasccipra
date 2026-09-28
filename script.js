document.addEventListener('DOMContentLoaded', () => {
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
