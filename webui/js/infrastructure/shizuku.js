const Shizuku = (() =>
{
    async function tryBridgeCall()
    {
        if (window.Shizuku && typeof window.Shizuku.exec === 'function')
        {
            return { name: 'Shizuku.exec', run: (cmd) => window.Shizuku.exec(cmd) };
        }
        return null;
    }

    async function getModuleTrustInfo()
    {
        if (!window.Shizuku || typeof window.Shizuku.getModuleInfo !== 'function') return null;
        try
        {
            return JSON.parse(window.Shizuku.getModuleInfo());
        }
        catch (e)
        {
            return null;
        }
    }

    async function executeShell(command)
    {
        try
        {
            const bridge = await tryBridgeCall();
            if (!bridge) return null;

            const raw = await bridge.run(command);
            if (typeof raw !== 'string') return null;

            let parsed;
            try
            {
                parsed = JSON.parse(raw);
            }
            catch (e)
            {
                return raw;
            }

            if (parsed && typeof parsed === 'object')
            {
                if (parsed.ok === false)
                {
                    console.warn('Shizuku.exec reported failure for:', command, parsed.stderr);
                    return '';
                }
                return (parsed.stdout != null ? String(parsed.stdout) : '').trim();
            }
            return String(raw);
        }
        catch (err)
        {
            console.error("Shell execution error:", err);
            return null;
        }
    }

    function showBridgeDebug(extraLine)
    {
        const el = document.getElementById('bridgeDebug');
        if (!el) return;
        el.style.display = 'block';
        let html = window.Shizuku
            ? 'Detected on window: <br>' + JSON.stringify(window.Shizuku, null, 4)
            : 'No Shizuku shell bridge object found on window.';
        if (extraLine) html = extraLine + '<br><br>' + html;
        el.innerHTML = html;
    }

    async function ensureBridgeReady()
    {
        const bridge = await tryBridgeCall();
        if (!bridge)
        {
            showBridgeDebug('No window.Shizuku bridge object found — nothing was granted.');
            Dialogs.alert("Could not reach the ADB shell bridge — nothing was granted. See the debug info under the header.");
            return false;
        }
        const trustInfo = await getModuleTrustInfo();
        if (trustInfo && trustInfo.trusted === false)
        {
            showBridgeDebug(
                `Module "${trustInfo.id || 'tasker-permissions'}" is not trusted — nothing was granted. ` +
                `Long-press this module's card in Shevery and grant Full Trust / Full Access.`
            );
            Dialogs.alert("This module isn't trusted yet in Shevery — nothing was granted. See the debug info under the header.");
            return false;
        }
        return true;
    }

    
    return {
        tryBridgeCall,
        getModuleTrustInfo,
        executeShell,
        showBridgeDebug,
        ensureBridgeReady
    };

})();
