const DetailView = (() =>
{
    function show()
    {
        document.getElementById('mainView').classList.remove('active');
        document.getElementById('detailView').classList.add('active');
        window.scrollTo(0, 0);
        applyMarquee();
    }
    
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
                { duration: 5000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
            );
        }
    }

    function clearSearchInput()
    {
        const searchInput = document.getElementById('detailSearchInput');
        if (searchInput) searchInput.value = '';

        const clearBtn = document.getElementById('clearDetailSearchBtn');
        if (clearBtn) clearBtn.style.display = 'none';
    }

    function renderContent(appViewModel, onCheckboxChange)
    {
        document.getElementById('detailTitle').textContent = appViewModel.name;
        document.getElementById('detailPackage').textContent = appViewModel.package;

        const icon = document.getElementById('detailIcon');
        icon.src = appViewModel.iconPath;
        icon.onerror = () => { icon.src = 'assets/android.png'; };

        const badge = document.getElementById('detailBadge');
        badge.className = `status-badge ${appViewModel.tagClass}`;
        badge.textContent = appViewModel.tagText;

        const permListContainer = document.getElementById('detailPermsList');
        permListContainer.innerHTML = '';

        if (appViewModel.permissionViewModels.length === 0)
        {
            permListContainer.innerHTML = '<div class="empty-message">No permissions declared for this app</div>';
            document.getElementById('selectAllBtn').disabled = true;
            document.getElementById('deselectAllBtn').disabled = true;
            document.getElementById('detailSearchInput').disabled = true;
            onCheckboxChange();
            return;
        }

        document.getElementById('selectAllBtn').disabled = appViewModel.disabled;
        document.getElementById('deselectAllBtn').disabled = appViewModel.disabled;
        document.getElementById('detailSearchInput').disabled = appViewModel.disabled;

        appViewModel.permissionViewModels.forEach(permVM =>
        {
            const label = document.createElement('label');
            label.className = 'perm-card';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = permVM.name;
            checkbox.checked = permVM.checked;
            checkbox.disabled = permVM.disabled;

            const info = document.createElement('div');
            info.className = 'perm-info';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'perm-card-header';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'perm-name';
            nameSpan.textContent = permVM.cleanName;

            const tag = document.createElement('span');
            tag.className = `perm-tag ${permVM.tagClass}`;
            tag.textContent = permVM.tagText;

            cardHeader.appendChild(nameSpan);
            cardHeader.appendChild(tag);

            const descSpan = document.createElement('p');
            descSpan.className = 'perm-desc';
            descSpan.textContent = permVM.description;

            info.appendChild(cardHeader);
            info.appendChild(descSpan);

            label.appendChild(checkbox);
            label.appendChild(info);
            permListContainer.appendChild(label);
        });

        const searchEmptyMsg = document.createElement('div');
        searchEmptyMsg.id = 'detailEmptyMessage';
        searchEmptyMsg.className = 'empty-message';
        searchEmptyMsg.textContent = 'No permissions match your search';
        searchEmptyMsg.style.display = 'none';

        permListContainer.appendChild(searchEmptyMsg);
        onCheckboxChange();
    }

    function setAllCheckboxes(checked, onCheckboxChange)
    {
        document.querySelectorAll('#detailPermsList .perm-card').forEach(card =>
        {
            if (card.style.display === 'none') return;
            const cb = card.querySelector('input[type="checkbox"]');
            if (cb && !cb.disabled) cb.checked = checked;
        });
        
        onCheckboxChange();
    }

    function getSelectedPermissions()
    {
        return [...document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked')].map(cb => cb.value);
    }

    function filterPermissions(query)
    {
        const container = document.getElementById('detailPermsList');
        if (!container) return;

        const cards = container.querySelectorAll('.perm-card');
        let hasVisible = false;

        cards.forEach(card =>
        {
            const name = card.querySelector('input[type="checkbox"]').value.toLowerCase();
            const cleanName = card.querySelector('.perm-name').textContent.toLowerCase();
            if (cleanName.includes(query) || name.includes(query))
            {
                card.style.display = 'flex';
                hasVisible = true;
            }
            else
            {
                card.style.display = 'none';
            }
        });

        const emptyMsg = document.getElementById('detailEmptyMessage');
        if (emptyMsg) emptyMsg.style.display = (!hasVisible && cards.length > 0) ? 'block' : 'none';
    }

    function renderDetailActionButtons(appViewModel)
    {
        if (!appViewModel) return;

        const hasChecked = document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked').length > 0;
        document.getElementById('grantSelectedBtn').disabled = appViewModel.disabled || !hasChecked;
        document.getElementById('revokeSelectedBtn').disabled = appViewModel.disabled || !hasChecked;
    }


    return {
        show,
        applyMarquee,
        clearSearchInput,
        renderContent,
        setAllCheckboxes,
        getSelectedPermissions,
        filterPermissions,
        renderDetailActionButtons
    };

})();
