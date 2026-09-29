document.addEventListener('DOMContentLoaded', () => {
    console.log('Catálogo Advance inicializado com sucesso.');

    const container = document.querySelector('.mobile-app-container');
    const screens = document.querySelectorAll('.screen');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (!container) {
        console.error('Container principal não encontrado.');
        return;
    }

    /* =====================================================
       LOGO DO RODAPÉ
       ===================================================== */

    const footerLogo = document.querySelector('.footer-logo');

    if (footerLogo) {
        footerLogo.innerHTML = '<img src="./logo.svg" alt="Advance Tintas" style="display:block;width:98px;height:auto;">';
    }

    /* =====================================================
       CONTINUE ROLANDO PARA BAIXO
       ===================================================== */

    if (scrollIndicator) {
        let hasScrolled = false;

        const hideScrollIndicator = () => {
            if (hasScrolled) return;
            hasScrolled = true;
            scrollIndicator.classList.add('hidden');
        };

        container.addEventListener(
            'scroll',
            () => {
                if (container.scrollTop > 5) {
                    hideScrollIndicator();
                }
            },
            { passive: true }
        );

        container.addEventListener(
            'touchmove',
            hideScrollIndicator,
            { passive: true, once: true }
        );

        container.addEventListener(
            'wheel',
            hideScrollIndicator,
            { passive: true, once: true }
        );
    }

    /* =====================================================
       OBSERVER DAS TELAS
       ===================================================== */

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Espaço reservado para futuras animações.
                    }
                });
            },
            {
                root: container,
                threshold: 0.5
            }
        );

        screens.forEach((screen) => {
            observer.observe(screen);
        });
    }
});
