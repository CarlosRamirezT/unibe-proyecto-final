window.addEventListener('load', function() {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const eyeButton = passwordInput.nextElementSibling;

    eyeButton.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
    });
});
