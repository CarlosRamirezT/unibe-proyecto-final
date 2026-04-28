var selectedTickers = [];
var focusTicker = '';

window.addEventListener('load', async function() {
    hydrateStocksContextFromQuery();
    await hydrateStocksContextFromUser();
    wireChatInteractions();

    try {
        var dates = ['Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 22', 'Jan 23'];
        var prices = [475, 478, 482, 480, 485, 488, 485.5];

        var trace = {
            type: 'scatter',
            mode: 'lines',
            x: dates,
            y: prices,
            line: {
                color: '#0052B4',
                width: 3
            },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 82, 180, 0.1)'
        };

        var layout = {
            margin: { t: 20, r: 20, b: 40, l: 60 },
            plot_bgcolor: '#0A0E27',
            paper_bgcolor: '#0A0E27',
            xaxis: {
                gridcolor: '#1E293B',
                color: '#94A3B8'
            },
            yaxis: {
                gridcolor: '#1E293B',
                color: '#94A3B8',
                title: 'Price (RD$)'
            },
            showlegend: false
        };

        var config = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
        };

        Plotly.newPlot('stock-chart', [trace], layout, config);
    } catch(e) {
        document.getElementById('stock-chart').innerHTML = '<div class="flex items-center justify-center h-full text-textSecondary">Chart unavailable</div>';
    }
});

function hydrateStocksContextFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var tickersRaw = params.get('tickers') || '';
    focusTicker = (params.get('focus') || '').trim().toUpperCase();

    var queryTickers = tickersRaw
        .split(',')
        .map(function(value) { return value.trim().toUpperCase(); })
        .filter(function(value) { return value.length > 0; });

    selectedTickers = uniqueTickers(queryTickers);
    renderStocksContext();
}

async function hydrateStocksContextFromUser() {
    var token = localStorage.getItem('qc_auth_token');
    if (!token) {
        return;
    }

    try {
        var response = await fetch('/api/user/stocks', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });

        if (!response.ok) {
            return;
        }

        var payload = await response.json();
        if (!Array.isArray(payload)) {
            return;
        }

        var profileTickers = payload.map(function(item) {
            return String(item.ticker || '').trim().toUpperCase();
        }).filter(function(value) {
            return value.length > 0;
        });

        selectedTickers = uniqueTickers(selectedTickers.concat(profileTickers));
        renderStocksContext();
    } catch {
        // Leave chat usable if user stocks are temporarily unavailable.
    }
}

function renderStocksContext() {
    var contextEl = document.getElementById('copilot-stocks-context');
    if (!contextEl) {
        return;
    }

    if (!selectedTickers.length && !focusTicker) {
        contextEl.classList.add('hidden');
        contextEl.textContent = '';
        return;
    }

    var contextText = 'Contexto IA';
    if (selectedTickers.length) {
        contextText += ': ' + selectedTickers.join(', ');
    }
    if (focusTicker) {
        contextText += ' | Foco: ' + focusTicker;
    }

    contextEl.textContent = contextText;
    contextEl.classList.remove('hidden');
}

function wireChatInteractions() {
    var messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) {
        return;
    }

    var inputEl = document.querySelector('#copilot-interface input[type="text"]');
    var sendButton = document.querySelector('#copilot-interface .border-t.border-border.p-4 button');
    if (!inputEl || !sendButton) {
        return;
    }

    sendButton.addEventListener('click', function() {
        submitChatMessage(inputEl, messagesEl);
    });

    inputEl.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        submitChatMessage(inputEl, messagesEl);
    });

    var quickPromptButtons = document.querySelectorAll('#prompt-templates button');
    quickPromptButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var titleEl = button.querySelector('h4');
            var subtitleEl = button.querySelector('p');
            var title = titleEl ? titleEl.textContent.trim() : '';
            var subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';
            var prompt = subtitle ? title + ': ' + subtitle : title;

            inputEl.value = prompt;
            submitChatMessage(inputEl, messagesEl);
        });
    });
}

async function submitChatMessage(inputEl, messagesEl) {
    var rawMessage = String(inputEl.value || '').trim();
    if (!rawMessage) {
        return;
    }

    var token = localStorage.getItem('qc_auth_token');
    if (!token) {
        appendAssistantMessage(messagesEl, 'Inicia sesion para usar el asistente IA.');
        return;
    }

    appendUserMessage(messagesEl, rawMessage);
    inputEl.value = '';

    var loadingNode = appendAssistantMessage(messagesEl, 'Analizando...');

    try {
        var response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({
                message: rawMessage,
                tickers: selectedTickers,
                metrics: {}
            })
        });

        if (response.status === 401) {
            loadingNode.textContent = 'Tu sesion expiro. Inicia sesion nuevamente.';
            return;
        }

        var payload = await safeJson(response);
        if (!response.ok) {
            loadingNode.textContent = payload && payload.error ? payload.error : 'No se pudo obtener respuesta del modelo.';
            return;
        }

        loadingNode.textContent = payload && payload.response ? payload.response : 'No se recibio contenido del modelo.';
    } catch {
        loadingNode.textContent = 'Error de red consultando el asistente IA.';
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendUserMessage(messagesEl, text) {
    var wrapper = document.createElement('div');
    wrapper.className = 'flex items-start space-x-3 justify-end';
    wrapper.innerHTML = [
        '<div class="bg-gradient-to-r from-accent to-primary rounded-lg p-4 max-w-2xl">',
        '<p class="text-sm"></p>',
        '</div>',
        '<img src="../assets/images/avatar-2.jpg" alt="user" class="w-8 h-8 rounded-full flex-shrink-0">'
    ].join('');
    wrapper.querySelector('p').textContent = text;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendAssistantMessage(messagesEl, text) {
    var wrapper = document.createElement('div');
    wrapper.className = 'flex items-start space-x-3';
    wrapper.innerHTML = [
        '<div class="w-8 h-8 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center flex-shrink-0">',
        '<i class="fa-solid fa-robot text-white text-sm"></i>',
        '</div>',
        '<div class="bg-surface border border-border rounded-lg p-4 max-w-2xl">',
        '<p class="text-sm whitespace-pre-wrap"></p>',
        '</div>'
    ].join('');

    var textNode = wrapper.querySelector('p');
    textNode.textContent = text;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return textNode;
}

function safeJson(response) {
    return response.json().catch(function() {
        return null;
    });
}

function uniqueTickers(list) {
    var seen = new Set();
    return list.filter(function(value) {
        if (!value || seen.has(value)) {
            return false;
        }

        seen.add(value);
        return true;
    });
}
