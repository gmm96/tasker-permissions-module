(function() {
    const scripts = [
        'js/apps.js',
        'js/app-status.js',
        'js/dialogs.js',
        'js/manager.js',
        'js/permissions.js',
        'js/permission-status.js',
        'js/shizuku.js',
        'js/viewport-fix.js'
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
            async (promiseChain, currentScript) =>
            {
                await promiseChain;
                return await loadScript(currentScript);
            },
            Promise.resolve()
        )
        .catch(error => console.error(error));
})();