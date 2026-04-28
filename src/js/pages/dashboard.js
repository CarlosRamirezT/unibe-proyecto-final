window.addEventListener('load', function() {
    try {
        var times = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
        var prices = [482, 483.5, 481, 485, 484, 486.5, 488, 487, 485.5, 486, 484.5, 485.5];

        var trace = {
            type: 'scatter',
            mode: 'lines',
            x: times,
            y: prices,
            line: {
                color: '#0052B4',
                width: 2.5
            },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 82, 180, 0.1)'
        };

        var layout = {
            margin: { t: 20, r: 60, b: 40, l: 60 },
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

        Plotly.newPlot('trading-chart', [trace], layout, config);
    } catch(e) {
        document.getElementById('trading-chart').innerHTML = '<div class="flex items-center justify-center h-full text-textSecondary">Chart unavailable</div>';
    }

    initComplianceTerms();
});

async function initComplianceTerms() {
    const token = localStorage.getItem('qc_auth_token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    const termsText = document.getElementById('terms-modal-text');
    const versionBadge = document.getElementById('terms-modal-version');
    const acceptButton = document.getElementById('accept-terms-btn');

    if (!termsText || !versionBadge || !acceptButton || typeof bootstrap === 'undefined') {
        return;
    }

    const modalElement = document.getElementById('termsModal');
    const termsModal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });

    let payload;
    try {
        const response = await fetch('/api/compliance/terms', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('qc_auth_token');
            localStorage.removeItem('qc_auth_user');
            localStorage.removeItem('qc_terms_modal_pending');
            window.location.href = './login.html';
            return;
        }

        payload = await response.json();
    } catch {
        return;
    }

    termsText.value = payload.text || '';
    versionBadge.textContent = payload.version || '';

    if (!payload.accepted) {
        termsModal.show();
    } else {
        localStorage.removeItem('qc_terms_modal_pending');
    }

    acceptButton.addEventListener('click', async function() {
        acceptButton.disabled = true;
        acceptButton.textContent = 'Guardando...';

        try {
            const response = await fetch('/api/compliance/terms/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({ version: payload.version })
            });

            if (!response.ok) {
                acceptButton.disabled = false;
                acceptButton.textContent = 'Aceptar y continuar';
                return;
            }

            localStorage.removeItem('qc_terms_modal_pending');
            termsModal.hide();
        } catch {
            acceptButton.disabled = false;
            acceptButton.textContent = 'Aceptar y continuar';
        }
    }, { once: true });
}
