window.addEventListener('load', function() {
    initSelectStocksPage();
});

async function initSelectStocksPage() {
    const token = localStorage.getItem('qc_auth_token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    const grid = document.getElementById('stocks-catalog-grid');
    const summary = document.getElementById('selection-summary');
    const message = document.getElementById('stocks-page-message');
    const finishButton = document.getElementById('finish-selection-btn');

    if (!grid || !summary || !message || !finishButton) {
        return;
    }

    finishButton.addEventListener('click', function() {
        window.location.href = './my-stocks.html';
    });

    let catalog = [];
    let userStocks = [];

    try {
        const [catalogResponse, userStocksResponse] = await Promise.all([
            fetch('/api/stocks'),
            fetch('/api/user/stocks', {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            })
        ]);

        if (userStocksResponse.status === 401) {
            localStorage.removeItem('qc_auth_token');
            localStorage.removeItem('qc_auth_user');
            window.location.href = './login.html';
            return;
        }

        if (!catalogResponse.ok || !userStocksResponse.ok) {
            message.textContent = 'No se pudo cargar la lista de acciones.';
            message.className = 'text-sm text-danger mb-4';
            return;
        }

        catalog = await catalogResponse.json();
        userStocks = await userStocksResponse.json();
    } catch {
        message.textContent = 'Error de red al cargar acciones.';
        message.className = 'text-sm text-danger mb-4';
        return;
    }

    const selected = new Set((userStocks || []).map(function(item) {
        return String(item.ticker || '').toUpperCase();
    }));

    renderCatalog(grid, catalog, selected, token, summary, message);
    updateSummary(summary, selected.size);
}

function renderCatalog(grid, catalog, selected, token, summary, message) {
    grid.innerHTML = '';

    if (!Array.isArray(catalog) || catalog.length === 0) {
        grid.innerHTML = '<div class="bg-surface border border-border rounded-xl p-4 text-textSecondary">No hay acciones disponibles en el catálogo.</div>';
        return;
    }

    catalog.forEach(function(stock) {
        const ticker = String(stock.ticker || '').toUpperCase();
        const name = String(stock.name || ticker);
        const isSelected = selected.has(ticker);

        const card = document.createElement('article');
        card.className = 'bg-surface border border-border rounded-xl p-4 flex items-center justify-between';

        const left = document.createElement('div');
        left.innerHTML = '<h3 class="font-semibold text-lg">' + escapeHtml(ticker) + '</h3><p class="text-sm text-textSecondary">' + escapeHtml(name) + '</p>';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'min-w-24 rounded-lg px-3 py-2 text-sm font-semibold transition-all';

        setButtonState(button, isSelected);

        button.addEventListener('click', async function() {
            if (selected.has(ticker)) {
                return;
            }

            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Guardando';

            try {
                const response = await fetch('/api/user/stocks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    },
                    body: JSON.stringify({ ticker: ticker, currentInvestment: 0 })
                });

                if (response.status === 401) {
                    localStorage.removeItem('qc_auth_token');
                    localStorage.removeItem('qc_auth_user');
                    window.location.href = './login.html';
                    return;
                }

                if (!response.ok && response.status !== 409) {
                    const payload = await safeJson(response);
                    message.textContent = payload?.error || 'No se pudo agregar la acción.';
                    message.className = 'text-sm text-danger mb-4';
                    setButtonState(button, false);
                    return;
                }

                selected.add(ticker);
                setButtonState(button, true);
                updateSummary(summary, selected.size);
                message.textContent = 'Acción agregada correctamente.';
                message.className = 'text-sm text-success mb-4';
            } catch {
                message.textContent = 'Error de red al agregar la acción.';
                message.className = 'text-sm text-danger mb-4';
                setButtonState(button, false);
            }
        });

        card.appendChild(left);
        card.appendChild(button);
        grid.appendChild(card);
    });
}

function setButtonState(button, selected) {
    if (selected) {
        button.disabled = true;
        button.className = 'min-w-24 rounded-lg px-3 py-2 text-sm font-semibold bg-success/20 text-success border border-success/30';
        button.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Agregado';
        return;
    }

    button.disabled = false;
    button.className = 'min-w-24 rounded-lg px-3 py-2 text-sm font-semibold bg-background border border-border text-textPrimary hover:border-accent';
    button.innerHTML = '<i class="fa-solid fa-plus mr-1"></i> Agregar';
}

function updateSummary(summary, count) {
    if (count <= 0) {
        summary.textContent = 'Aún no has agregado acciones.';
        return;
    }

    summary.textContent = 'Acciones agregadas: ' + count + '. Cuando termines, continúa a Mis Acciones.';
}

function safeJson(response) {
    return response.json().catch(function() {
        return null;
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
