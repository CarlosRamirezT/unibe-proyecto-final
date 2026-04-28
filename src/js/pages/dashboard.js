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

    initProtectedFlows();
});

const PLAN_LABELS = {
    FREE: 'FREE',
    PRO: 'PRO',
    ELITE: 'ELITE',
    B2B: 'B2B'
};

const PLAN_SELECTION_REQUIRED_KEY = 'qc_plan_selection_required';

async function initProtectedFlows() {
    const token = localStorage.getItem('qc_auth_token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    const termsOk = await initComplianceTerms(token);
    if (!termsOk) {
        return;
    }

    await initPlanSelection(token);
    await ensureInitialStocksSelection(token);
}

async function ensureInitialStocksSelection(token) {
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
            return;
        }

        const payload = await response.json();
        if (Array.isArray(payload) && payload.length === 0) {
            window.location.href = './select-stocks.html';
        }
    } catch {
        // Keep dashboard usable if stocks service is temporarily unavailable.
    }
}

async function initComplianceTerms(token) {
    const termsText = document.getElementById('terms-modal-text');
    const versionBadge = document.getElementById('terms-modal-version');
    const acceptButton = document.getElementById('accept-terms-btn');

    if (!termsText || !versionBadge || !acceptButton || typeof bootstrap === 'undefined') {
        return false;
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
            return false;
        }

        payload = await response.json();
    } catch {
        return false;
    }

    termsText.value = payload.text || '';
    versionBadge.textContent = payload.version || '';

    if (!payload.accepted) {
        termsModal.show();
        const accepted = await waitForTermsAcceptance(token, payload.version, termsModal, acceptButton);
        return accepted;
    }

    localStorage.removeItem('qc_terms_modal_pending');
    return true;
}

function waitForTermsAcceptance(token, version, termsModal, acceptButton) {
    return new Promise(function(resolve) {
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
                    body: JSON.stringify({ version })
                });

                if (!response.ok) {
                    acceptButton.disabled = false;
                    acceptButton.textContent = 'Aceptar y continuar';
                    resolve(false);
                    return;
                }

                localStorage.removeItem('qc_terms_modal_pending');
                termsModal.hide();
                resolve(true);
            } catch {
                acceptButton.disabled = false;
                acceptButton.textContent = 'Aceptar y continuar';
                resolve(false);
            }
        }, { once: true });
    });
}

async function initPlanSelection(token) {
    if (typeof bootstrap === 'undefined') {
        return;
    }

    const badge = document.getElementById('user-plan-badge');
    const editButton = document.getElementById('edit-plan-btn');
    const saveButton = document.getElementById('save-plan-btn');
    const cancelButton = document.getElementById('cancel-plan-btn');
    const message = document.getElementById('plan-modal-message');
    const modalElement = document.getElementById('planModal');
    const planButtons = modalElement
        ? Array.from(modalElement.querySelectorAll('[data-plan-select]'))
        : [];

    if (!badge || !editButton || !saveButton || !cancelButton || !message || !modalElement || planButtons.length === 0) {
        return;
    }

    const planModal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });

    let currentPlan = null;
    try {
        const response = await fetch('/api/user/plan', {
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

        const payload = await response.json();
        currentPlan = payload?.plan || null;
    } catch {
        return;
    }

    renderPlanBadge(currentPlan, badge);

    if (currentPlan) {
        localStorage.removeItem(PLAN_SELECTION_REQUIRED_KEY);
    }

    const requiresPlanSelection = localStorage.getItem(PLAN_SELECTION_REQUIRED_KEY) === '1';
    if (!currentPlan && requiresPlanSelection) {
        hideCancelButton(cancelButton, true);
        openPlanModal(planModal, currentPlan);
    }

    editButton.addEventListener('click', function() {
        hideCancelButton(cancelButton, false);
        message.textContent = '';
        openPlanModal(planModal, currentPlan);
    });

    cancelButton.addEventListener('click', function() {
        planModal.hide();
    });

    planButtons.forEach(function(button) {
        button.addEventListener('click', async function() {
            const selectedPlan = button.getAttribute('data-plan-select');
            if (!selectedPlan) {
                return;
            }

            const selectedRadio = document.querySelector('input[name="user-plan"][value="' + selectedPlan + '"]');
            if (selectedRadio) {
                selectedRadio.checked = true;
            }

            message.textContent = '';
            setPlanButtonsState(planButtons, true, button, 'Guardando...');

            try {
                const response = await fetch('/api/user/plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    },
                    body: JSON.stringify({ plan: selectedPlan })
                });

                const payload = await response.json();
                if (!response.ok) {
                    message.textContent = payload?.error || 'No se pudo guardar el plan.';
                    message.className = 'text-sm text-danger mt-3';
                    return;
                }

                currentPlan = payload.plan;
                renderPlanBadge(currentPlan, badge);
                localStorage.removeItem(PLAN_SELECTION_REQUIRED_KEY);
                planModal.hide();
                window.alert('Tu plan se selecciono exitosamente.');
                window.location.href = './index.html';
            } catch {
                message.textContent = 'Error de red. Intenta nuevamente.';
                message.className = 'text-sm text-danger mt-3';
            } finally {
                setPlanButtonsState(planButtons, false);
            }
        });
    });

    // Fallback to preserve legacy flow if this button is ever made visible again.
    saveButton.addEventListener('click', function() {
        message.textContent = 'Selecciona tu plan desde las tarjetas para continuar.';
        message.className = 'text-sm text-danger mt-3';
    });
}

function renderPlanBadge(plan, badgeElement) {
    const normalized = String(plan || '').toUpperCase();
    badgeElement.textContent = PLAN_LABELS[normalized] || 'FREE';
}

function openPlanModal(planModal, plan) {
    const normalized = String(plan || 'FREE').toUpperCase();
    const radio = document.querySelector('input[name="user-plan"][value="' + normalized + '"]');
    if (radio) {
        radio.checked = true;
    }

    planModal.show();
}

function setPlanButtonsState(buttons, disabled, targetButton, loadingText) {
    buttons.forEach(function(btn) {
        const defaultLabel = btn.getAttribute('data-default-label') || btn.textContent.trim();
        if (!btn.getAttribute('data-default-label')) {
            btn.setAttribute('data-default-label', defaultLabel);
        }

        btn.disabled = disabled;
        if (disabled && targetButton && btn === targetButton) {
            btn.textContent = loadingText || 'Guardando...';
        } else {
            btn.textContent = defaultLabel;
        }
    });
}

function hideCancelButton(button, required) {
    if (required) {
        button.classList.add('hidden');
        return;
    }

    button.classList.remove('hidden');
}
