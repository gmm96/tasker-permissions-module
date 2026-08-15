(function () {
    function applyHeight() {
        var h = window.innerHeight;
        if (!h || h <= 0) return;

        // Fija también el body: si el fondo oscuro solo llega hasta donde
        // el WebView "cree" que mide la página, queda un hueco sin pintar
        // por debajo aunque el contenido interno esté bien colocado.
        document.body.style.minHeight = h + 'px';

        document.querySelectorAll('.view-screen.active').forEach(function (el) {
            el.style.minHeight = h + 'px';
        });
    }

    applyHeight();
    window.addEventListener('load', applyHeight);
    window.addEventListener('resize', applyHeight);
    window.addEventListener('orientationchange', function () {
        setTimeout(applyHeight, 50);
    });

    // Reintentos agresivos durante los primeros segundos: si el WebView
    // de Shevery redimensiona su contenedor DESPUÉS de que la página ya
    // haya cargado, esto lo detecta y corrige sin que el usuario note nada.
    var tries = 0;
    var iv = setInterval(function () {
        applyHeight();
        tries++;
        if (tries > 40) clearInterval(iv); // ~12s de reintentos cada 300ms
    }, 300);

    // Reaplicar cuando cambia de vista (mainView <-> detailView) o cuando
    // se repinta contenido dentro de la vista activa (nuevos permisos, etc.)
    var observer = new MutationObserver(applyHeight);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['class'] });
})();