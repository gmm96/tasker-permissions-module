const LoadingSpinner = (() =>
{
    function show(text = 'Processing...') 
    {
        const overlay = document.getElementById('loadingOverlay');
        const textItem = document.getElementById('loadingText');
        if (overlay && textItem)
        {
            textItem.textContent = text;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hide() 
    {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay)
        {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }


    return {
        show,
        hide
    }

})();