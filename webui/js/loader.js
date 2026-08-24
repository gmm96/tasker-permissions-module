(function()
{
    const scripts =
    [
        'js/infrastructure/data/apps.js',
        'js/infrastructure/data/permissions.js',
        'js/domain/enums/app-status.js',
        'js/domain/enums/permission-status.js',
        'js/domain/enums/tab-status.js',
        'js/domain/models/permission.js',
        'js/domain/models/app-condition.js',
        'js/domain/models/app.js',
        'js/ui/viewmodels/permission-viewmodel.js',
        'js/ui/viewmodels/app-viewmodel.js',
        'js/application/services/status-mapper.js',
        'js/ui/components/dialogs.js',
        'js/ui/components/spinner.js',
        'js/ui/components/viewport-fix.js',
        'js/ui/components/search-input.js',
        'js/infrastructure/shizuku.js',
        'js/application/services/permission-service.js',
        'js/ui/view-state.js',
        'js/ui/components/main-view.js',
        'js/ui/components/detail-view.js',
        'js/manager.js'
    ];

    function loadScript(src)
    {
        return new Promise((resolve, reject) =>
        {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Error loading script: ${src}`));
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
