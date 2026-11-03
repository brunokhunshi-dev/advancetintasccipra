document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.mobile-app-container');
    const screens = document.querySelectorAll('.screen');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!container) return;


    /* Produto pesquisável: só confirma uma opção da lista. */
    const productInput = document.getElementById('contact-product');
    const productList = document.getElementById('product-options');
    if (productInput && productList) {
        const options = ['Adzinc 9500', 'Econvance Epoxy HDF 3500', 'Ecovance Epoxy WST', 'Outro'];
        let selected = '';
        let filtered = options;
        let active = -1;
        const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const validate = () => productInput.setCustomValidity(
            selected && productInput.value === selected ? '' : 'Selecione um produto da lista.'
        );
        const close = () => {
            productList.hidden = true;
            productInput.setAttribute('aria-expanded', 'false');
            productInput.removeAttribute('aria-activedescendant');
            active = -1;
        };
        const choose = value => {
            selected = value;
            productInput.value = value;
            validate();
            close();
            productInput.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const render = () => {
            const query = selected === productInput.value ? '' : normalize(productInput.value.trim());
            filtered = options.filter(value => normalize(value).includes(query));
            productList.replaceChildren();
            filtered.forEach((value, index) => {
                const item = document.createElement('li');
                item.id = 'product-option-' + index;
                item.role = 'option';
                item.setAttribute('aria-selected', String(index === active));
                item.textContent = value;
                // Mantém o foco no campo durante o toque/clique.
                item.addEventListener('pointerdown', event => event.preventDefault());
                item.addEventListener('click', () => choose(value));
                productList.append(item);
            });
            if (!filtered.length) {
                const empty = document.createElement('li');
                empty.className = 'product-no-results';
                empty.textContent = 'Nenhum produto encontrado. Busque “Outro” se necessário.';
                productList.append(empty);
            }
            productList.hidden = false;
            productInput.setAttribute('aria-expanded', 'true');
            if (active >= 0 && filtered[active]) {
                productInput.setAttribute('aria-activedescendant', 'product-option-' + active);
            } else productInput.removeAttribute('aria-activedescendant');
        };
        productInput.addEventListener('focus', render);
        productInput.addEventListener('click', render);
        productInput.addEventListener('input', () => { selected = ''; active = -1; validate(); render(); });
        productInput.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (productList.hidden) { active = -1; render(); }
                if (filtered.length) {
                    active = event.key === 'ArrowDown' ? (active + 1) % filtered.length
                        : (active <= 0 ? filtered.length - 1 : active - 1);
                    render();
                    productList.children[active]?.scrollIntoView({ block: 'nearest' });
                }
            } else if (event.key === 'Enter' && !productList.hidden) {
                event.preventDefault();
                if (active >= 0) choose(filtered[active]);
                else if (filtered.length === 1) choose(filtered[0]);
            } else if (event.key === 'Escape') { event.preventDefault(); close(); }
            else if (event.key === 'Tab') close();
        });
        productInput.addEventListener('blur', () => { validate(); close(); });
        document.addEventListener('pointerdown', event => {
            if (!productInput.closest('.product-picker').contains(event.target)) close();
        });
        productInput.form?.addEventListener('reset', () => { selected = ''; close(); validate(); });
        validate();
    }

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

    /* Navegação do índice e atalho de contato */
    document.querySelectorAll('.index-list a[href^="#"], .hero-contact-button[href^="#"]').forEach((link) => {
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
