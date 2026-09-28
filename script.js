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
       CONTINUE ROLANDO PARA BAIXO
       ===================================================== */

    if (scrollIndicator) {

        let hasScrolled = false;

        const hideScrollIndicator = () => {
            if (hasScrolled) return;

            hasScrolled = true;

            scrollIndicator.classList.add('hidden');
        };


        // Esconde quando o scroll realmente começar
        container.addEventListener(
            'scroll',
            () => {
                if (container.scrollTop > 5) {
                    hideScrollIndicator();
                }
            },
            {
                passive: true
            }
        );


        // Esconde imediatamente no primeiro movimento do dedo
        container.addEventListener(
            'touchmove',
            hideScrollIndicator,
            {
                passive: true,
                once: true
            }
        );


        // Esconde ao usar scroll com mouse/trackpad
        container.addEventListener(
            'wheel',
            hideScrollIndicator,
            {
                passive: true,
                once: true
            }
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
