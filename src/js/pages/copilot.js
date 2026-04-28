var selectedTickers = [];
var focusTicker = '';

window.addEventListener('load', async function() {
    hydrateStocksContextFromQuery();
    await hydrateStocksContextFromUser();
    await loadMarketSummary();
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

    var availableTickers = uniqueTickers(
        [focusTicker].concat(selectedTickers).filter(function(value) {
            return String(value || '').trim().length > 0;
        })
    );

    if (!availableTickers.length) {
        contextEl.classList.add('hidden');
        contextEl.textContent = '';
        return;
    }

    if (!focusTicker || availableTickers.indexOf(focusTicker) === -1) {
        focusTicker = availableTickers[0];
    }

    contextEl.innerHTML = [
        '<div class="flex flex-wrap items-center gap-2 justify-between">',
            '<span class="font-semibold">Contexto IA</span>',
            '<label class="inline-flex items-center gap-2">',
                '<span class="text-white/80">Ticker</span>',
                '<select id="copilot-ticker-select" class="bg-surface border border-white/30 rounded-md px-2 py-1 text-white text-sm focus:outline-none focus:border-white/60">',
                    availableTickers.map(function(ticker) {
                        var isSelected = ticker === focusTicker ? ' selected' : '';
                        return '<option value="' + escapeHtml(ticker) + '"' + isSelected + '>' + escapeHtml(ticker) + '</option>';
                    }).join(''),
                '</select>',
            '</label>',
        '</div>',
        '<p class="mt-1 mb-0 text-white/80">Universo: ' + escapeHtml(availableTickers.join(', ')) + '</p>'
    ].join('');

    var selectEl = document.getElementById('copilot-ticker-select');
    if (selectEl) {
        selectEl.addEventListener('change', function(event) {
            focusTicker = String(event.target.value || '').trim().toUpperCase();
            loadMarketSummary();
        });
    }

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
    attachQuickPromptInfoTips(quickPromptButtons);
    quickPromptButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var titleEl = button.querySelector('h4');
            var subtitleEl = button.querySelector('p');
            var title = titleEl ? titleEl.textContent.trim() : '';
            var subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';
            var prompt = buildQuickPrompt(title, subtitle);

            inputEl.value = prompt;
            submitChatMessage(inputEl, messagesEl);
        });
    });
}

function attachQuickPromptInfoTips(quickPromptButtons) {
    quickPromptButtons.forEach(function(button) {
        var titleEl = button.querySelector('h4');
        if (!titleEl || titleEl.dataset.infoTipAttached === '1') {
            return;
        }

        var title = titleEl.textContent.trim();
        titleEl.classList.add('inline-flex', 'items-center');
        titleEl.insertAdjacentHTML('beforeend', buildInfoTipHtml(title, getQuickPromptHelpText(title)));
        titleEl.dataset.infoTipAttached = '1';
    });

    if (window.InfoTip && typeof window.InfoTip.init === 'function') {
        window.InfoTip.init(document.getElementById('prompt-templates'));
    }
}

function getQuickPromptHelpText(title) {
    var normalized = String(title || '').toLowerCase();
    if (normalized.indexOf('analyze') >= 0) {
        return 'Solicita un analisis integral del ticker: momentum, niveles y riesgos.';
    }

    if (normalized.indexOf('portfolio') >= 0) {
        return 'Pide una propuesta de cartera balanceada segun perfil y objetivos de riesgo.';
    }

    if (normalized.indexOf('indicator') >= 0) {
        return 'Recibe una explicacion simple de como interpretar un indicador tecnico.';
    }

    if (normalized.indexOf('risk') >= 0) {
        return 'Evalua exposicion, volatilidad y posibles escenarios adversos.';
    }

    if (normalized.indexOf('news') >= 0) {
        return 'Relaciona noticias recientes con posibles impactos sobre precio y sentimiento.';
    }

    return 'Prompt sugerido para obtener respuestas mas rapidas del asistente.';
}

function buildQuickPrompt(title, subtitle) {
    var normalized = String(title || '').toLowerCase();
    var activeTicker = getActiveTicker();

    if (normalized.indexOf('analyze') >= 0) {
        var universe = uniqueTickers([focusTicker].concat(selectedTickers)).join(', ');
        return [
            'Analyze this ticker: ' + activeTicker + '.',
            subtitle || 'Get comprehensive analysis of any stock.',
            universe ? 'Context tickers: ' + universe + '.' : ''
        ].filter(function(line) { return line.length > 0; }).join(' ');
    }

    return subtitle ? title + ': ' + subtitle : title;
}

function getActiveTicker() {
    if (focusTicker) {
        return focusTicker;
    }

    if (selectedTickers.length) {
        return selectedTickers[0];
    }

    return 'AAPL';
}

async function loadMarketSummary() {
    var loadingEl = document.getElementById('market-summary-loading');
    var errorEl = document.getElementById('market-summary-error');
    var contentEl = document.getElementById('market-summary-content');
    var tickerEl = document.getElementById('market-summary-ticker');
    var demoBadgeEl = document.getElementById('market-summary-demo-badge');
    var rangesBody = document.getElementById('market-summary-ranges-body');
    var indicatorsEl = document.getElementById('market-summary-indicators');

    if (!loadingEl || !errorEl || !contentEl || !tickerEl || !demoBadgeEl || !rangesBody || !indicatorsEl) {
        return;
    }

    var targetTicker = focusTicker || (selectedTickers.length ? selectedTickers[0] : 'AAPL');
    tickerEl.textContent = 'Ticker: ' + targetTicker;

    showMarketSummaryLoading(loadingEl, errorEl, contentEl);

    try {
        var response = await fetch('/api/market/summary?ticker=' + encodeURIComponent(targetTicker));
        var payload = await safeJson(response);

        if (!response.ok || !payload) {
            showMarketSummaryError('No se pudo cargar el resumen de mercado.', loadingEl, errorEl, contentEl);
            return;
        }

        renderMarketSummary(payload, demoBadgeEl, rangesBody, indicatorsEl);
        loadingEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
    } catch {
        showMarketSummaryError('Error de red al cargar indicadores.', loadingEl, errorEl, contentEl);
    }
}

function showMarketSummaryLoading(loadingEl, errorEl, contentEl) {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.add('hidden');
}

function showMarketSummaryError(message, loadingEl, errorEl, contentEl) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
}

function renderMarketSummary(payload, demoBadgeEl, rangesBody, indicatorsEl) {
    var isDemo = !!payload.isDemo;
    demoBadgeEl.textContent = isDemo ? 'demo' : 'real';
    demoBadgeEl.className = isDemo ? 'badge text-bg-secondary' : 'badge text-bg-success';

    var ranges = [
        {
            label: 'Ultima hora',
            value: payload.lastHourChangePct,
            info: 'Cambio porcentual reciente. Util para detectar impulso intradia de corto plazo.'
        },
        {
            label: 'Ultimo dia',
            value: payload.lastDayChangePct,
            info: 'Variacion diaria frente al cierre previo. Mide la reaccion inmediata del mercado.'
        },
        {
            label: 'Ultima semana',
            value: payload.lastWeekChangePct,
            info: 'Tendencia de 7 dias. Ayuda a validar si el movimiento diario tiene continuidad.'
        },
        {
            label: 'Ultimo mes',
            value: payload.lastMonthChangePct,
            info: 'Rendimiento de 30 dias aproximados. Aporta contexto para swings de corto-mediano plazo.'
        },
        {
            label: '3 meses',
            value: payload.last3MonthsChangePct,
            info: 'Rendimiento trimestral. Referencia comun para comparar fortaleza relativa entre tickers.'
        },
        {
            label: '6 meses',
            value: payload.last6MonthsChangePct,
            info: 'Rendimiento semestral. Muestra la direccion principal antes de una evaluacion anual.'
        },
        {
            label: 'Ultimo ano',
            value: payload.lastYearChangePct,
            info: 'Rendimiento anual. Ayuda a evaluar comportamiento del activo en un ciclo mas amplio.'
        }
    ];

    rangesBody.innerHTML = '';
    ranges.forEach(function(item) {
        var tr = document.createElement('tr');
        var value = Number(item.value || 0);
        var colorClass = value >= 0 ? 'text-success' : 'text-danger';

        tr.innerHTML = [
            '<td class="text-textSecondary">' +
                '<span class="inline-flex items-center">' +
                    escapeHtml(item.label) +
                    buildInfoTipHtml(item.label, item.info) +
                '</span>' +
            '</td>',
            '<td class="text-end ' + colorClass + '">' + formatPercent(value) + '</td>'
        ].join('');
        rangesBody.appendChild(tr);
    });

    indicatorsEl.innerHTML = '';
    var indicators = Array.isArray(payload.indicators) ? payload.indicators : [];
    indicators.forEach(function(item) {
        var li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2';

        var suffix = item && item.isDemo ? ' (demo)' : '';
        var indicatorName = String(item.name || 'Indicador');
        li.innerHTML = [
            '<span class="text-textSecondary text-xs inline-flex items-center">' +
                escapeHtml(indicatorName + suffix) +
                buildInfoTipHtml(indicatorName, getIndicatorHelpText(indicatorName)) +
            '</span>',
            '<span class="text-sm font-medium ' + getIndicatorValueClass(indicatorName, String(item.value || '-')) + '">' + escapeHtml(String(item.value || '-')) + '</span>'
        ].join('');
        indicatorsEl.appendChild(li);
    });

    if (window.InfoTip && typeof window.InfoTip.init === 'function') {
        window.InfoTip.init(document.getElementById('market-summary-panel'));
    }
}

function buildInfoTipHtml(title, content) {
    if (window.InfoTip && typeof window.InfoTip.createButton === 'function') {
        return window.InfoTip.createButton({
            title: title,
            content: content
        });
    }

    return '';
}

function getIndicatorHelpText(indicatorName) {
    var normalized = String(indicatorName || '').toUpperCase();
    if (normalized.indexOf('RSI') >= 0) {
        return 'RSI mide momentum en escala 0-100. Sobre 70 puede indicar sobrecompra; bajo 30, sobreventa.';
    }

    if (normalized.indexOf('SMA 50') >= 0) {
        return 'Promedio movil simple de 50 periodos. Se usa para tendencia intermedia y zonas de soporte/resistencia.';
    }

    if (normalized.indexOf('SMA 200') >= 0) {
        return 'Promedio movil simple de 200 periodos. Referencia clave para tendencia de largo plazo.';
    }

    if (normalized.indexOf('VOLATILIDAD') >= 0) {
        return 'Volatilidad estimada del precio. Mayor volatilidad implica movimientos mas amplios y mas riesgo.';
    }

    if (normalized.indexOf('BETA') >= 0) {
        return 'Beta compara sensibilidad frente al mercado: 1 = similar, >1 = mas agresivo, <1 = mas defensivo.';
    }

    if (normalized.indexOf('VOLUMEN RELATIVO') >= 0) {
        return 'Volumen negociado comparado contra su promedio. >1x sugiere interes superior al habitual.';
    }

    return 'Indicador de analisis tecnico utilizado para apoyar decisiones de entrada, salida y riesgo.';
}

function formatPercent(value) {
    var sign = value > 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
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
        var chatTickers = focusTicker ? [focusTicker] : selectedTickers;
        var response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({
                message: rawMessage,
                tickers: chatTickers,
                metrics: {}
            })
        });

        if (response.status === 401) {
            renderAssistantText(loadingNode, 'Tu sesion expiro. Inicia sesion nuevamente.', false);
            return;
        }

        var payload = await safeJson(response);
        if (!response.ok) {
            if (payload && payload.error && payload.error.toLowerCase().indexOf('rate limit') >= 0) {
                renderAssistantText(loadingNode, 'El proveedor IA esta saturado temporalmente (rate limit). Intenta nuevamente en 30-60 segundos.', false);
                return;
            }

            renderAssistantText(loadingNode, payload && payload.error ? payload.error : 'No se pudo obtener respuesta del modelo.', false);
            return;
        }

        renderAssistantText(loadingNode, payload && payload.response ? payload.response : 'No se recibio contenido del modelo.', true);
    } catch {
        renderAssistantText(loadingNode, 'Error de red consultando el asistente IA.', false);
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
        '<div class="text-sm"></div>',
        '</div>'
    ].join('');

    var textNode = wrapper.querySelector('div.text-sm');
    renderAssistantText(textNode, text, false);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return textNode;
}

function renderAssistantText(node, text, allowRichFormat) {
    if (!node) {
        return;
    }

    var safeText = String(text || '');
    if (!allowRichFormat) {
        node.textContent = safeText;
        return;
    }

    node.innerHTML = formatMarkdownLikeTextAsHtml(safeText);
}

function formatMarkdownLikeTextAsHtml(text) {
    var lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    var html = [];
    var listType = null;

    function closeListIfNeeded() {
        if (!listType) {
            return;
        }

        html.push(listType === 'ol' ? '</ol>' : '</ul>');
        listType = null;
    }

    lines.forEach(function(rawLine) {
        var line = rawLine.trim();
        if (!line) {
            closeListIfNeeded();
            return;
        }

        var headingMatch = line.match(/^#{1,6}\s+(.+)$/);
        if (headingMatch) {
            closeListIfNeeded();
            html.push('<p class="font-semibold text-textPrimary mt-2 mb-1">' + formatInlineMarkdown(headingMatch[1]) + '</p>');
            return;
        }

        var bulletMatch = line.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
            if (listType !== 'ul') {
                closeListIfNeeded();
                listType = 'ul';
                html.push('<ul class="list-disc pl-5 my-1 space-y-1">');
            }

            html.push('<li>' + formatInlineMarkdown(bulletMatch[1]) + '</li>');
            return;
        }

        var orderedMatch = line.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            if (listType !== 'ol') {
                closeListIfNeeded();
                listType = 'ol';
                html.push('<ol class="list-decimal pl-5 my-1 space-y-1">');
            }

            html.push('<li>' + formatInlineMarkdown(orderedMatch[1]) + '</li>');
            return;
        }

        closeListIfNeeded();
        html.push('<p class="leading-6 my-1">' + formatInlineMarkdown(line) + '</p>');
    });

    closeListIfNeeded();

    if (!html.length) {
        return '<p class="leading-6">' + escapeHtml(text) + '</p>';
    }

    return html.join('');
}

function formatInlineMarkdown(text) {
    var safe = escapeHtml(String(text || ''));
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/__(.*?)__/g, '<strong>$1</strong>');
    return safe;
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

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getIndicatorValueClass(indicatorName, rawValue) {
    var name = String(indicatorName || '').toUpperCase();
    var value = parseIndicatorNumericValue(rawValue);
    if (!Number.isFinite(value)) {
        return 'text-textPrimary';
    }

    if (name.indexOf('RSI') >= 0) {
        if (value >= 45 && value <= 60) return 'text-success';
        if ((value >= 35 && value < 45) || (value > 60 && value <= 70)) return 'text-warning';
        return 'text-danger';
    }

    if (name.indexOf('VOLATILIDAD') >= 0) {
        if (value < 2) return 'text-success';
        if (value <= 4) return 'text-warning';
        return 'text-danger';
    }

    if (name.indexOf('BETA') >= 0) {
        if (value >= 0.8 && value <= 1.2) return 'text-success';
        if ((value >= 0.6 && value < 0.8) || (value > 1.2 && value <= 1.6)) return 'text-warning';
        return 'text-danger';
    }

    if (name.indexOf('VOLUMEN RELATIVO') >= 0) {
        if (value >= 0.8 && value <= 1.8) return 'text-success';
        if ((value >= 0.5 && value < 0.8) || (value > 1.8 && value <= 2.5)) return 'text-warning';
        return 'text-danger';
    }

    return 'text-textPrimary';
}

function parseIndicatorNumericValue(rawValue) {
    var normalized = String(rawValue || '')
        .replace(',', '.')
        .replace(/[^0-9.+-]/g, '');

    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
}
