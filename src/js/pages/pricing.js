window.addEventListener('load', function() {
    const billingToggles = document.querySelectorAll('.billing-toggle');
    const planButtonSelectors = [
        '#plan-free button',
        '#plan-pro button',
        '#plan-elite button'
    ];

    planButtonSelectors.forEach(function(selector) {
        const button = document.querySelector(selector);
        if (!button) {
            return;
        }

        button.addEventListener('click', function() {
            showSuccessToast('Tu plan se selecciono exitosamente.', function() {
                window.location.href = './index.html';
            });
        });
    });

    billingToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            billingToggles.forEach(btn => {
                btn.classList.remove('bg-accent', 'text-white');
                btn.classList.add('text-textSecondary');
            });
            this.classList.add('bg-accent', 'text-white');
            this.classList.remove('text-textSecondary');

            const period = this.getAttribute('data-period');
            updatePricing(period);
        });
    });

    function updatePricing(period) {
        const prices = {
            monthly: {
                free: 'DOP 0',
                pro: 'DOP 1,899',
                elite: 'DOP 4,999'
            },
            annual: {
                free: 'DOP 0',
                pro: 'DOP 1,519',
                elite: 'DOP 3,999'
            }
        };
    }

    function showSuccessToast(message, onDone) {
        const existing = document.querySelector('.qc-toast');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'qc-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML =
            '<div class="qc-toast-icon"><i class="fa-solid fa-check"></i></div>' +
            '<div class="qc-toast-content">' +
            '<div class="qc-toast-title">Plan actualizado</div>' +
            '<div class="qc-toast-message">' + message + '</div>' +
            '</div>';

        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('qc-toast--visible');
        });

        setTimeout(function() {
            toast.classList.remove('qc-toast--visible');
            setTimeout(function() {
                toast.remove();
                if (typeof onDone === 'function') {
                    onDone();
                }
            }, 220);
        }, 900);
    }
});
