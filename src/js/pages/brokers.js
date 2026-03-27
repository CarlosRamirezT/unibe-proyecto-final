window.addEventListener('load', function() {
    const compareBtn = document.getElementById('compareBtn');
    const drawer = document.getElementById('comparisonDrawer');
    const closeDrawer = document.getElementById('closeDrawer');
    const connectModal = document.getElementById('connectModal');
    const closeModal = document.getElementById('closeModal');
    const connectBtns = document.querySelectorAll('.bg-gradient-to-r');

    compareBtn.addEventListener('click', function() {
        drawer.classList.toggle('translate-y-full');
    });

    closeDrawer.addEventListener('click', function() {
        drawer.classList.add('translate-y-full');
    });

    connectBtns.forEach(btn => {
        if(btn.textContent.trim() === 'Connect') {
            btn.addEventListener('click', function() {
                connectModal.classList.remove('hidden');
            });
        }
    });

    closeModal.addEventListener('click', function() {
        connectModal.classList.add('hidden');
    });

    connectModal.addEventListener('click', function(e) {
        if(e.target === connectModal) {
            connectModal.classList.add('hidden');
        }
    });
});
