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
