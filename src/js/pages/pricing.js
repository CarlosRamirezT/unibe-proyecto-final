window.addEventListener('load', function() {
    const billingToggles = document.querySelectorAll('.billing-toggle');

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
});
