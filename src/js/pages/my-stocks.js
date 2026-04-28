window.addEventListener('load', function() {
    initMyStocksPage();
});

async function initMyStocksPage() {
    const token = localStorage.getItem('qc_auth_token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    const container = document.getElementById('my-stocks-list');
    const message = document.getElementById('my-stocks-message');

    if (!container || !message) {
        return;
    }

    await loadUserStocks(token, container, message);
}

async function loadUserStocks(token, container, message) {
    container.innerHTML = '';
    message.textContent = '';

    let items;
    try {
        const response = await fetch('/api/user/stocks', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('qc_auth_token');
            localStorage.removeItem('qc_auth_user');
            window.location.href = './login.html';
            return;
        }

        if (!response.ok) {
            message.textContent = 'No se pudo cargar tu lista de acciones.';
            message.className = 'text-sm text-danger mb-4';
            return;
        }

        items = await response.json();
    } catch {
        message.textContent = 'Error de red al cargar Mis Acciones.';
        message.className = 'text-sm text-danger mb-4';
        return;
    }

    if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = [
            '<div class="bg-surface border border-border rounded-xl p-6">',
            '<h3 class="text-xl font-semibold mb-2">No tienes acciones agregadas</h3>',
            '<p class="text-textSecondary mb-4">Selecciona tus primeros tickers para personalizar tu experiencia.</p>',
            '<a href="./select-stocks.html" class="inline-flex items-center bg-gradient-to-r from-secondary to-accent text-white font-semibold rounded-lg px-5 py-2.5">',
            '<i class="fa-solid fa-plus mr-2"></i>Seleccionar Acciones',
            '</a>',
            '</div>'
        ].join('');
        return;
    }

    items.forEach(function(item) {
        const ticker = String(item.ticker || '').toUpperCase();
        const name = String(item.name || ticker);
        const investment = Number(item.currentInvestment || 0);
        const addedAt = item.addedAtUtc ? new Date(item.addedAtUtc) : null;

        const row = document.createElement('article');
        row.className = 'bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4';

        const left = document.createElement('div');
        left.innerHTML = [
            '<h3 class="font-semibold text-lg">' + escapeHtml(ticker) + ' <span class="text-sm text-textSecondary">' + escapeHtml(name) + '</span></h3>',
            '<p class="text-sm text-textSecondary">Inversión actual: <span class="text-textPrimary font-medium">' + formatCurrency(investment) + '</span></p>',
            addedAt ? '<p class="text-xs text-textSecondary">Agregado: ' + escapeHtml(formatDate(addedAt)) + '</p>' : ''
        ].join('');

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'bg-background border border-border text-textPrimary rounded-lg px-4 py-2 text-sm font-medium hover:border-danger';
        removeButton.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Quitar';

        removeButton.addEventListener('click', async function() {
            removeButton.disabled = true;
            removeButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Quitando';

            try {
                const response = await fetch('/api/user/stocks/' + encodeURIComponent(ticker), {
                    method: 'DELETE',
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem('qc_auth_token');
                    localStorage.removeItem('qc_auth_user');
                    window.location.href = './login.html';
                    return;
                }

                if (!response.ok) {
                    message.textContent = 'No se pudo quitar la acción seleccionada.';
                    message.className = 'text-sm text-danger mb-4';
                    removeButton.disabled = false;
                    removeButton.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Quitar';
                    return;
                }

                await loadUserStocks(token, container, message);
            } catch {
                message.textContent = 'Error de red al quitar la acción.';
                message.className = 'text-sm text-danger mb-4';
                removeButton.disabled = false;
                removeButton.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Quitar';
            }
        });

        row.appendChild(left);
        row.appendChild(removeButton);
        container.appendChild(row);
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
