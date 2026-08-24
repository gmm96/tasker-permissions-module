const Dialogs = (() =>
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

    const titleElement = overlay.querySelector('.ui-modal-title');
    const messageElement = overlay.querySelector('.ui-modal-message');
    const actionElements = overlay.querySelector('.ui-modal-actions');
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

    function runModal(setup)
    {
        const task = () => new Promise(resolve =>
        {
            titleElement.textContent = setup.title || '';
            titleElement.style.display = setup.title ? 'block' : 'none';
            messageElement.innerHTML = setup.message || '';
            actionElements.innerHTML = '';

            let settled = false;
            const finish = (value) =>
            {
                if (settled) return;
                settled = true;
                closeModal();
                setTimeout(() => resolve(value), 180);
            };

            setup.buttons(finish).forEach(btn => actionElements.appendChild(btn));
            overlay.onclick = (e) =>
            {
                if (e.target === overlay && setup.dismissible !== false) finish(setup.dismissValue);
            };
            openModal();
        });

        const result = queue.then(task);
        queue = result.then( () => {}, () => {} );
        return result;
    }

    function alert(message, options)
    {
        options = options || {};

        return runModal(
        {
            title: options.title,
            message: message,
            dismissValue: undefined,
            buttons: (finish) =>
            [
                buildButton(options.buttonText || 'OK', 'ui-modal-btn-primary', () => finish())
            ]
        });
    }

    function confirm(message, options)
    {
        options = options || {};

        return runModal(
        {
            title: options.title,
            message: message,
            dismissValue: false,
            buttons: (finish) =>
            [
                buildButton(options.cancelText || 'Cancel', 'ui-modal-btn-secondary', () => finish(false)),
                buildButton(options.confirmText || 'Confirm', options.danger ? 'ui-modal-btn-danger' : 'ui-modal-btn-primary', () => finish(true))
            ]
        });
    }


    return {
        alert,
        confirm
    };

})();