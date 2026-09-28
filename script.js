document.addEventListener('DOMContentLoaded', () => {
    console.log('Catálogo Advance inicializado com sucesso.');

    const container = document.querySelector('.mobile-app-container');
    const screens = document.querySelectorAll('.screen');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    /* =====================================================
       INDICADOR "CONTINUE ROLANDO"
       ===================================================== */

    let hasScrolled = false;

    const hideScrollIndicator = () => {
        if (hasScrolled || !scrollIndicator) return;

        hasScrolled = true;
        scrollIndicator.classList.add('hidden');
    };

    /* Some assim que o container realmente começar a rolar */
    container.addEventListener('scroll', () => {
        if (container.scrollTop > 5) {
            hideScrollIndicator();
        }
    }, { passive: true });

    /* No celular, some assim que a pessoa começar o gesto */
    container.addEventListener('touchmove', hideScrollIndicator, {
        passive: true
    });


    /* =====================================================
       OBSERVER DAS TELAS
       ===================================================== */

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
