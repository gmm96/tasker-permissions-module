export function wire(inputId, clearBtnId, onChange)
{
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(clearBtnId);
    if (!input || !clearBtn) return;

    input.addEventListener('input', e =>
    {
        clearBtn.style.display = e.target.value.length > 0 ? 'flex' : 'none';
        onChange(e.target.value.toLowerCase());
    });

    clearBtn.addEventListener('click', () =>
    {
        input.value = '';
        clearBtn.style.display = 'none';
        onChange('');
        input.focus();
    });
}
