const PermissionService = (() =>
{
    function isPermissionGrantedInDumpsys(dumpResult, permission)
    {
        if (!dumpResult) return false;
        const escaped = permission.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const grantedRegex = new RegExp(`^\\s*${escaped}:\\s*granted=true`, 'm');
        return grantedRegex.test(dumpResult);
    }

    async function inspectAppPermissions(app)
    {
        const bridge = await Shizuku.tryBridgeCall();

        if (!bridge)
        {
            Shizuku.showBridgeDebug('No window.Shizuku bridge object found.');
            return new AppCondition(AppStatus.ERROR, {});
        }

        const trustInfo = await Shizuku.getModuleTrustInfo();
        if (trustInfo && trustInfo.trusted === false)
        {
            Shizuku.showBridgeDebug(
                `Module "${trustInfo.id || 'hidden-permissions'}" is not trusted (mode: ${trustInfo.accessMode || 'unknown'}). ` +
                `Long-press this module's card in Shevery/Nightzuku/Shizuku ADB Module Manager and grant Full Trust / Full Access.`
            );
            return new AppCondition(AppStatus.ERROR, {});
        }

        try
        {
            const pkgResult = await Shizuku.executeShell(`pm list packages ${app.package}`);
            if (pkgResult === null)
            {
                Shizuku.showBridgeDebug();
                return new AppCondition(AppStatus.ERROR, {});
            }
            if (!pkgResult.includes(`package:${app.package}`))
            {
                return new AppCondition(AppStatus.NOTINSTALLED, {});
            }

            const dumpsysResult = await Shizuku.executeShell(`dumpsys package ${app.package}`);
            const permsState = {};
            let grantedCount = 0;

            for (const permission of app.permissions)
            {
                const isGranted = isPermissionGrantedInDumpsys(dumpsysResult, permission.name);
                permsState[permission.name] = isGranted;
                if (isGranted) grantedCount++;
            }

            const total = app.permissions.length;
            let status = AppStatus.PARTIAL;

            if (grantedCount === 0) status = AppStatus.NONEGRANTED;
            else if (grantedCount === total) status = AppStatus.ALLGRANTED;

            return new AppCondition(status, permsState);
        }
        catch (e)
        {
            console.error("Error inspecting " + app.id, e);
            return new AppCondition(AppStatus.ERROR, {});
        }
    }

    async function processPermissions(pkg, perms, action)
    {
        for (const perm of perms)
        {
            try
            {
                await Shizuku.executeShell(`pm ${action} ${pkg} ${perm}`);
            }
            catch(e)
            {
                console.error(`Failed ${action} ${perm} for ${pkg}`, e);
            }
        }
    }

    async function runBulkAction(options, onComplete, onGoBack)
    {
        const {
            action,
            targets,
            emptyMessage,
            confirmMessage,
            confirmOptions,
            loadingText,
            successMessage,
            goBackAfter = false
        } = options;

        if (!targets || targets.length === 0)
        {
            if (emptyMessage) Dialogs.alert(emptyMessage);
            return;
        }

        if (confirmMessage)
        {
            const ok = await Dialogs.confirm(confirmMessage, confirmOptions);
            if (!ok) return;
        }

        if (!(await Shizuku.ensureBridgeReady())) return;

        LoadingSpinner.show(loadingText);
        await new Promise(r => setTimeout(r, 100));

        try
        {
            for (const target of targets)
            {
                await processPermissions(target.pkg, target.perms, action);
            }
            await onComplete();
        }
        finally
        {
            LoadingSpinner.hide();
        }

        if (goBackAfter) onGoBack();
        Dialogs.alert(successMessage);
    }

    function runSelectedAction(action, activeApp, selectedPerms, onComplete, onGoBack)
    {
        if (!activeApp) return;
        const targetName = activeApp.name;

        const texts = action === 'grant'
            ? { verb: 'grant', ing: 'Granting', done: 'granted', prep: 'to' }
            : { verb: 'revoke', ing: 'Revoking', done: 'revoked', prep: 'from' };

        runBulkAction(
            {
                action,
                targets: selectedPerms.length ? [{ pkg: activeApp.package, perms: selectedPerms }] : [],
                emptyMessage: `No permissions selected to ${texts.verb}.`,
                loadingText: `${texts.ing} permissions...`,
                successMessage: `Permissions successfully ${texts.done} ${texts.prep} <b>${targetName}</b> app.`,
                goBackAfter: true
            },
            onComplete,
            onGoBack
        );
    }

    return {
        inspectAppPermissions,
        processPermissions,
        runBulkAction,
        runSelectedAction
    };

})();
