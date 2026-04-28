window.addEventListener('load', function() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const messageBox = ensureMessageBox(loginForm);
    const eyeButton = passwordInput.nextElementSibling;
    const params = new URLSearchParams(window.location.search);

    if (params.get('registered') === '1') {
        showMessage(messageBox, 'Registration completed. You can sign in now.');
    }

    eyeButton.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        setLoading(submitButton, true, 'Signing in...');
        showMessage(messageBox, '');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            const payload = await tryParseJson(response);
            if (!response.ok) {
                const message = payload?.error || 'Invalid email or password.';
                showMessage(messageBox, message, true);
                return;
            }

            localStorage.setItem('qc_auth_token', payload.token);
            localStorage.setItem('qc_auth_user', JSON.stringify(payload.user));
            localStorage.setItem('qc_terms_modal_pending', 'true');
            showMessage(messageBox, 'Login successful. Redirecting...');
            window.setTimeout(function () {
                window.location.href = './dashboard.html';
            }, 300);
        } catch {
            showMessage(messageBox, 'Network error. Please try again.', true);
        } finally {
            setLoading(submitButton, false, 'Sign In');
        }
    });
});

function ensureMessageBox(form) {
    let box = document.getElementById('login-message');
    if (!box) {
        box = document.createElement('p');
        box.id = 'login-message';
        box.className = 'text-sm text-textSecondary';
        form.appendChild(box);
    }

    return box;
}

function showMessage(box, message, isError) {
    box.textContent = message || '';
    box.className = isError
        ? 'text-sm text-danger'
        : 'text-sm text-textSecondary';
}

function setLoading(button, loading, loadingText) {
    if (!button) {
        return;
    }

    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
        button.classList.add('opacity-70', 'cursor-not-allowed');
        return;
    }

    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('opacity-70', 'cursor-not-allowed');
}

async function tryParseJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
