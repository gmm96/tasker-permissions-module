function applyMarquee()
{
    const pkgElement = document.getElementById('detailPackage');
    pkgElement.style.textOverflow = 'ellipsis';
    const overflow = pkgElement.scrollWidth - pkgElement.clientWidth;

    if (overflow > 0)
    {
        pkgElement.style.textOverflow = 'clip';
        const originalText = pkgElement.textContent;
        pkgElement.innerHTML = `<span style="display: inline-block;">${originalText}</span>`;
        
        const textSpan = pkgElement.firstChild;
        textSpan.animate(
            [
                { transform: 'translateX(0)', offset: 0 },
                { transform: 'translateX(0)', offset: 0.15 },
                { transform: `translateX(-${overflow}px)`, offset: 0.85 },
                { transform: `translateX(-${overflow}px)`, offset: 1 }
            ],
            {
                duration: 5000,
                iterations: Infinity,
                direction: 'alternate',
                easing: 'ease-in-out'
            }
        );
    }
}

function renderDetailActionButtons(appViewModel)
{
    if (!appViewModel) return;

    const hasChecked = document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked').length > 0;
    document.getElementById('grantSelectedBtn').disabled = appViewModel.disabled || !hasChecked;
    document.getElementById('revokeSelectedBtn').disabled = appViewModel.disabled || !hasChecked;
}

function filterDetailPermissions(query)
{
    const cards = document.querySelectorAll('#detailPermsList .perm-card');
    let visibleCount = 0;

    cards.forEach(card =>
    {
        const cleanName = card.querySelector('.perm-name').textContent.toLowerCase();
        const name = card.querySelector('input[type="checkbox"]').value.toLowerCase();
        if (cleanName.includes(query) || name.includes(query))
        {
            card.style.display = 'flex';
            visibleCount++;
        }
        else
        {
            card.style.display = 'none';
        }
    });

    const emptyMsg = document.getElementById('detailEmptyMessage');
    if (emptyMsg)
    {
        emptyMsg.style.display = (visibleCount === 0 && cards.length > 0) ? 'block' : 'none';
    }
}

function readInputAndApplyDetailFilter()
{
    const detailInput = document.getElementById('detailSearchInput');
    if (detailInput)
    {
        const query = (detailInput.value || '').toLowerCase();
        filterDetailPermissions(query);
    }
}
