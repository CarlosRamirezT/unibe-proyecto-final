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

    const selectedTickers = items.map(function(item) {
        return String(item.ticker || '').toUpperCase();
    });

    const header = document.createElement('div');
    header.className = 'hidden md:grid md:grid-cols-12 bg-surface border border-border rounded-xl px-4 py-3 text-xs uppercase tracking-wide text-textSecondary';
    header.innerHTML = [
        '<div class="md:col-span-3">Accion</div>',
        '<div class="md:col-span-3">Monto invertido actualmente</div>',
        '<div class="md:col-span-3">Agregado</div>',
        '<div class="md:col-span-3 text-right">Acciones</div>'
    ].join('');
    container.appendChild(header);

    items.forEach(function(item) {
        const ticker = String(item.ticker || '').toUpperCase();
        const name = String(item.name || ticker);
        const investment = Number(item.currentInvestment || 0);
        const addedAt = item.addedAtUtc ? new Date(item.addedAtUtc) : null;
        const copilotUrl = buildCopilotUrl(selectedTickers, ticker);

        const row = document.createElement('article');
        row.className = 'bg-surface border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center';

        const left = document.createElement('div');
        left.className = 'md:col-span-3';
        left.innerHTML = [
            '<h3 class="font-semibold text-lg">' + escapeHtml(ticker) + ' <span class="text-sm text-textSecondary">' + escapeHtml(name) + '</span></h3>',
            '<p class="text-xs text-textSecondary md:hidden">Agregado: ' + escapeHtml(addedAt ? formatDate(addedAt) : '-') + '</p>'
        ].join('');

        const investmentCell = document.createElement('div');
        investmentCell.className = 'md:col-span-3';
        investmentCell.innerHTML = [
            '<label class="text-xs text-textSecondary block mb-1 md:hidden">Monto invertido actualmente</label>',
            '<div class="flex items-center gap-2">',
            '<input type="number" min="0" step="0.01" value="' + escapeHtml(String(investment.toFixed(2))) + '" class="investment-input w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent" />',
            '<button type="button" class="save-investment-btn bg-background border border-border text-textPrimary rounded-lg px-3 py-2 text-xs font-medium hover:border-accent">Guardar</button>',
            '</div>'
        ].join('');

        const addedCell = document.createElement('div');
        addedCell.className = 'md:col-span-3 text-sm text-textSecondary';
        addedCell.textContent = addedAt ? formatDate(addedAt) : '-';

        const actionsCell = document.createElement('div');
        actionsCell.className = 'md:col-span-3 flex items-center justify-end gap-2';

        const aiButton = document.createElement('a');
        aiButton.href = copilotUrl;
        aiButton.className = 'bg-background border border-border text-textPrimary rounded-lg px-3 py-2 text-sm font-medium hover:border-accent';
        aiButton.innerHTML = '<i class="fa-solid fa-star mr-1 text-accent"></i> IA';

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'bg-background border border-border text-textPrimary rounded-lg px-4 py-2 text-sm font-medium hover:border-danger';
        removeButton.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Quitar';

        const investmentInput = investmentCell.querySelector('.investment-input');
        const saveInvestmentButton = investmentCell.querySelector('.save-investment-btn');

        saveInvestmentButton.addEventListener('click', async function() {
            const rawAmount = String(investmentInput.value || '').trim();
            const amount = Number(rawAmount);

            if (!Number.isFinite(amount) || amount < 0) {
                message.textContent = 'Ingresa un monto valido mayor o igual a 0.';
                message.className = 'text-sm text-danger mb-4';
                return;
            }

            saveInvestmentButton.disabled = true;
            saveInvestmentButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Guardando';

            try {
                const response = await fetch('/api/user/stocks/' + encodeURIComponent(ticker) + '/investment', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    },
                    body: JSON.stringify({ amount: Number(amount.toFixed(2)) })
                });

                if (response.status === 401) {
                    localStorage.removeItem('qc_auth_token');
                    localStorage.removeItem('qc_auth_user');
                    window.location.href = './login.html';
                    return;
                }

                if (!response.ok) {
                    const payload = await safeJson(response);
                    message.textContent = payload?.error || 'No se pudo guardar el monto invertido.';
                    message.className = 'text-sm text-danger mb-4';
                    return;
                }

                const payload = await response.json();
                const updatedAmount = Number(payload?.currentInvestment || amount);
                investmentInput.value = updatedAmount.toFixed(2);
                message.textContent = 'Monto actualizado para ' + ticker + '.';
                message.className = 'text-sm text-success mb-4';
            } catch {
                message.textContent = 'Error de red al guardar el monto invertido.';
                message.className = 'text-sm text-danger mb-4';
            } finally {
                saveInvestmentButton.disabled = false;
                saveInvestmentButton.innerHTML = 'Guardar';
            }
        });

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

        actionsCell.appendChild(aiButton);
        actionsCell.appendChild(removeButton);

        row.appendChild(left);
        row.appendChild(investmentCell);
        row.appendChild(addedCell);
        row.appendChild(actionsCell);
        container.appendChild(row);
    });
}

function buildCopilotUrl(tickers, focusTicker) {
    const params = new URLSearchParams();
    params.set('tickers', tickers.join(','));
    params.set('focus', focusTicker);
    return './copilot.html?' + params.toString();
}

function safeJson(response) {
    return response.json().catch(function() {
        return null;
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
