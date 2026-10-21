document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.mobile-app-container');
    const screens = document.querySelectorAll('.screen');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!container) return;

    /* QR Code do aviso desktop — usa a URL atual da própria página */
    const qrTarget = document.getElementById('desktop-qr');

    if (qrTarget && typeof QRCode !== 'undefined') {
        const mobileUrl = window.location.origin + window.location.pathname + window.location.search;

        new QRCode(qrTarget, {
            text: mobileUrl,
            width: 184,
            height: 184,
            colorDark: '#040438',
            colorLight: '#FFFFFF',
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    /* Sem endpoint de formulário: encaminha os dados ao WhatsApp comercial. */
    const contactForm = document.getElementById('contact-form');
    contactForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!contactForm.reportValidity()) return;
        const data = new FormData(contactForm);
        const message = [
            'Olá! Vim pela página da Advance Tintas no CCIPRA.',
            `Nome: ${data.get('nome')}`,
            `Celular/WhatsApp: ${data.get('celular')}`,
            `Email: ${data.get('email')}`,
            data.get('empresa') && `Empresa: ${data.get('empresa')}`,
            data.get('produto') && `Produto: ${data.get('produto')}`,
            data.has('amostra') && 'Desejo solicitar uma amostra de produto.',
            data.get('mensagem') && `Mensagem: ${data.get('mensagem')}`
        ].filter(Boolean).join('\n');
        window.open(`https://wa.me/5519991019992?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });

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
