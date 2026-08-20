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
