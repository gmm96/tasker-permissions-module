(function () {
    function applyHeight() {
        var h = window.innerHeight;
        if (h && h > 0) {
            document.querySelectorAll('.view-screen.active').forEach(function (el) {
                el.style.minHeight = h + 'px';
            });
        }
    }

    // Aplicar ya, y en los eventos normales
    applyHeight();
    window.addEventListener('load', applyHeight);
    window.addEventListener('resize', applyHeight);
    window.addEventListener('orientationchange', function () {
        setTimeout(applyHeight, 50);
    });

    // Reintentos durante los primeros segundos: si el WebView de Shevery
    // redimensiona su contenedor DESPUÉS de que la página ya haya cargado
    // (algo que sospechamos, dado que ni siquiera Eruda ocupaba toda la
    // pantalla), esto lo detecta y corrige sin que el usuario note nada.
    var tries = 0;
    var iv = setInterval(function () {
        applyHeight();
        tries++;
        if (tries > 25) clearInterval(iv); // ~7.5s de reintentos cada 300ms
    }, 300);

    // Por si el sitio cambia de vista (mainView <-> detailView) dinámicamente,
    // reaplicamos también cuando cambia el DOM.
    var observer = new MutationObserver(applyHeight);
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
})();