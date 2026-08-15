(function() {
    const scripts =
    [
        'js/data/apps.js',
        'js/data/permissions.js',
        'js/enum/app-status.js',
        'js/enum/permission-status.js',
        'js/ui/dialogs.js',
        'js/ui/spinner.js',
        'js/ui/viewport-fix.js',
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
            async (promiseChain, currentScript) =>
            {
                await promiseChain;
                return await loadScript(currentScript);
            },
            Promise.resolve()
        )
        .catch(error => console.error(error));
})();
