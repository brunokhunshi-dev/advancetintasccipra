document.addEventListener('DOMContentLoaded', () => {
    console.log('Catálogo Advance inicializado com sucesso.');

    const container = document.querySelector('.mobile-app-container');
    const screens = [...document.querySelectorAll('.screen')];

    let currentScreen = 0;
    let startY = 0;
    let isScrolling = false;

    const goToScreen = (index) => {
        if (index < 0 || index >= screens.length || isScrolling) return;

        isScrolling = true;
        currentScreen = index;

        screens[index].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        setTimeout(() => {
            isScrolling = false;
        }, 700);
    };

    /* =========================
       SWIPE NO CELULAR
    ========================= */

    container.addEventListener(
        'touchstart',
        (event) => {
            startY = event.touches[0].clientY;
        },
        { passive: true }
    );

    container.addEventListener(
        'touchend',
        (event) => {
            const endY = event.changedTouches[0].clientY;
            const distance = startY - endY;

            // Ignora movimentos pequenos
            if (Math.abs(distance) < 50) return;

            if (distance > 0) {
                // Swipe para cima
                goToScreen(currentScreen + 1);
            } else {
                // Swipe para baixo
                goToScreen(currentScreen - 1);
            }
        },
        { passive: true }
    );

    /* =========================
       ATUALIZA TELA ATUAL
    ========================= */

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = screens.indexOf(entry.target);

                    if (index !== -1 && !isScrolling) {
                        currentScreen = index;
                    }
                }
            });
        },
        {
            root: container,
            threshold: 0.6
        }
    );

    screens.forEach((screen) => observer.observe(screen));
});
