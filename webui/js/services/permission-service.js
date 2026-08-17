function isPermissionGrantedInDumpsys(dumpResult, permission)
{
    if (!dumpResult) return false;
    const escaped = permission.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const grantedRegex = new RegExp(`^\\s*${escaped}:\\s*granted=true`, 'm');
    return grantedRegex.test(dumpResult);
}

async function inspectAppPermissions(app)
{
    const bridge = await tryBridgeCall();

    if (!bridge)
        {
        showBridgeDebug('No window.Shizuku bridge object found.');
        return new AppSnapshot(AppStatus.ERROR, {});
    }

    const trustInfo = await getModuleTrustInfo();
    if (trustInfo && trustInfo.trusted === false)
    {
        showBridgeDebug(
            `Module "${trustInfo.id || 'hidden-permissions'}" is not trusted (mode: ${trustInfo.accessMode || 'unknown'}). ` +
            `Long-press this module's card in Shevery/Nightzuku/Shizuku ADB Module Manager and grant Full Trust / Full Access.`
        );
        return new AppSnapshot(AppStatus.ERROR, {});
    }

    try
    {
        const pkgResult = await executeShell(`pm list packages ${app.package}`);
        if (pkgResult === null)
        {
            showBridgeDebug();
            return new AppSnapshot(AppStatus.ERROR, {});
        }
        if (!pkgResult.includes(`package:${app.package}`))
        {
            return new AppSnapshot(AppStatus.NOTINSTALLED, {});
        }

        const dumpsysResult = await executeShell(`dumpsys package ${app.package}`);
        const permsState = {};
        let grantedCount = 0;

        for (const permission of app.permissions)
        {
            const isGranted = isPermissionGrantedInDumpsys(dumpsysResult, permission);
            permsState[permission] = isGranted;
            if (isGranted) grantedCount++;
        }

        const total = app.permissions.length;
        let status = AppStatus.PARTIAL;

        if (grantedCount === 0)
        {
            status = AppStatus.NONEGRANTED;
        }
        else if (grantedCount === total)
        {
            status = AppStatus.ALLGRANTED;
        }

        return new AppSnapshot(status, permsState);
    }
    catch (e)
    {
        console.error("Error inspecting " + app.id, e);
        return new AppSnapshot(AppStatus.ERROR, {});
    }
}

async function processPermissions(pkg, perms, action)
{
    for (const perm of perms)
    {
        try
        {
            await executeShell(`pm ${action} ${pkg} ${perm}`);
        }
        catch(e)
        {
            console.error(`Failed ${action} ${perm} for ${pkg}`, e);
        }
    }
}
