(function() {
    const scripts = [
        'js/viewport-fix.js',
        'js/apps.js',
        'js/permissions.js',
        'js/dialogs.js',
        'js/shizuku.js',
        'js/manager.js'
    ];

    function loadScript(src)
    {
        return new Promise((resolve, reject) =>
        {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Error loading: ${src}`));
            document.head.appendChild(script);
        });
    }

    scripts
        .reduce(
            (promiseChain, currentScript) => { return promiseChain.then(() => loadScript(currentScript)); },
            Promise.resolve()
        )
        .catch(error => console.error(error));
})();