// alertUi / confirmUi
// Reemplazo de los alert() / confirm() nativos (no funcionan dentro del WebView).
// Misma firma "async" que el confirm nativo: confirmUi(message) -> Promise<boolean>
// alertUi(message) -> Promise<void> (se resuelve al pulsar OK / tocar fuera)
//
// Uso:
//   alertUi("Operación completada");
//   alertUi("Algo falló", { title: "Error" });
//
//   if (await confirmUi("¿Seguro que quieres continuar?")) { ... }
//   if (await confirmUi("Esto revocará todo", { danger: true, confirmText: "Revocar" })) { ... }
//
// Las llamadas se encolan: si se lanza un alertUi/confirmUi mientras otro
// está abierto, el siguiente espera a que el anterior se cierre.

(function ()
{
    const overlay = document.createElement('div');
    overlay.className = 'ui-modal-overlay';
    overlay.innerHTML = `
        <div class="ui-modal" role="alertdialog" aria-modal="true">
            <p class="ui-modal-title"></p>
            <p class="ui-modal-message"></p>
            <div class="ui-modal-actions"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const modal = overlay.querySelector('.ui-modal');
    const titleEl = overlay.querySelector('.ui-modal-title');
    const messageEl = overlay.querySelector('.ui-modal-message');
    const actionsEl = overlay.querySelector('.ui-modal-actions');

    let queue = Promise.resolve();

    function buildButton(label, variant, onClick)
    {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ui-modal-btn' + (variant ? (' ' + variant) : '');
        btn.textContent = label;
        btn.onclick = onClick;
        return btn;
    }

    function openModal()
    {
        overlay.classList.add('show');
    }

    function closeModal()
    {
        overlay.classList.remove('show');
        overlay.onclick = null;
    }

    // setup: { title, message, dismissValue, buttons(finish) => [btn, ...] }
    function runModal(setup)
    {
        const task = () => new Promise(resolve =>
        {
            titleEl.textContent = setup.title || '';
            titleEl.style.display = setup.title ? 'block' : 'none';
            messageEl.textContent = setup.message || '';
            actionsEl.innerHTML = '';

            let settled = false;
            const finish = (value) =>
            {
                if (settled) return;
                settled = true;
                closeModal();
                // Espera a que termine la transición de salida antes de
                // resolver, para no encadenar el siguiente modal de golpe.
                setTimeout(() => resolve(value), 180);
            };

            setup.buttons(finish).forEach(btn => actionsEl.appendChild(btn));

            overlay.onclick = (e) =>
            {
                if (e.target === overlay && setup.dismissible !== false)
                {
                    finish(setup.dismissValue);
                }
            };

            openModal();
        });

        const result = queue.then(task);
        // Si algo falla, no bloquear la cola para siempre.
        queue = result.then(() => {}, () => {});
        return result;
    }

    window.alertUi = function (message, options)
    {
        options = options || {};
        return runModal({
            title: options.title,
            message: message,
            dismissValue: undefined,
            buttons: (finish) => [
                buildButton(options.buttonText || 'OK', 'ui-modal-btn-primary', () => finish())
            ]
        });
    };

    window.confirmUi = function (message, options)
    {
        options = options || {};
        return runModal({
            title: options.title,
            message: message,
            dismissValue: false,
            buttons: (finish) => [
                buildButton(options.cancelText || 'Cancelar', 'ui-modal-btn-secondary', () => finish(false)),
                buildButton(
                    options.confirmText || 'Confirmar',
                    options.danger ? 'ui-modal-btn-danger' : 'ui-modal-btn-primary',
                    () => finish(true)
                )
            ]
        });
    };
})();
