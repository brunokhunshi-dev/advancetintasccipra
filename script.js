document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.mobile-app-container');
    const screens = document.querySelectorAll('.screen');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!container) return;

    /* Logo do rodapé */
    const footerLogo = document.querySelector('.footer-logo');

    if (footerLogo) {
        footerLogo.innerHTML = '<img src="./logo.svg" alt="Advance Tintas" style="display:block;width:98px;height:auto;">';
    }

    /* Continue rolando */
    if (scrollIndicator) {
        let hasScrolled = false;

        const hideScrollIndicator = () => {
            if (hasScrolled) return;
            hasScrolled = true;
            scrollIndicator.classList.add('hidden');
        };

        container.addEventListener('scroll', () => {
            if (container.scrollTop > 5) hideScrollIndicator();
        }, { passive: true });

        container.addEventListener('touchmove', hideScrollIndicator, { passive: true, once: true });
        container.addEventListener('wheel', hideScrollIndicator, { passive: true, once: true });
    }

    /* Navegação do índice */
    document.querySelectorAll('.index-list a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.getAttribute('href'));

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        });
    });

    /* Itens que entram em motion */
    const motionSelectors = [
        '.hero-top',
        '.hero-bottom h1',
        '.about-content > *',
        '.icon-card',
        '.index-header > *',
        '.list-item',
        '.bg-number',
        '.solution-content h2',
        '.solution-content .subtitle',
        '.tag',
        '.solution-footer .desc',
        '.products li',
        '.contact-header > *',
        '.btn',
        '.footer-logo',
        '.contact-links li'
    ];

    screens.forEach((screen) => {
        const items = screen.querySelectorAll(motionSelectors.join(','));

        items.forEach((item, index) => {
            item.classList.add('motion-item');
            item.style.setProperty('--motion-delay', `${Math.min(index * 55, 330)}ms`);
        });
    });

    /* Ativação suave por tela */
    if ('IntersectionObserver' in window && !reduceMotion) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-active');
                    }
                });
            },
            {
                root: container,
                threshold: 0.35
            }
        );

        screens.forEach((screen) => observer.observe(screen));
    } else {
        screens.forEach((screen) => screen.classList.add('is-active'));
    }

    /* Garante que a primeira tela entre imediatamente */
    if (screens[0]) {
        requestAnimationFrame(() => screens[0].classList.add('is-active'));
    }
});
