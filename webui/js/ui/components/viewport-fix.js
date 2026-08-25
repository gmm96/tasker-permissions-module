let tries = 0;

function applyHeight()
{
    var height = window.innerHeight;
    if (!height || height <= 0) return;

    document.body.style.minHeight = height + 'px';
    document.querySelectorAll('.view-screen.active').forEach((element) => element.style.minHeight = height + 'px');
}

function retryApplyHeight()
{
    applyHeight();
    tries++;
    if (tries > 40) clearInterval(iv);
}

const iv = setInterval(retryApplyHeight, 300);

applyHeight();
window.addEventListener('load', applyHeight);
window.addEventListener('resize', applyHeight);
window.addEventListener('orientationchange', () => setTimeout(applyHeight, 50));

var observer = new MutationObserver(applyHeight);
observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['class'] });
