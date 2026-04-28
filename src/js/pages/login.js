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
            window.dispatchEvent(new CustomEvent('qc:terms-modal-requested'));

            showMessage(messageBox, 'Login successful.');
            openTermsModal();
        } catch {
            showMessage(messageBox, 'Network error. Please try again.', true);
        } finally {
            setLoading(submitButton, false, 'Sign In');
        }
    });
});

function openTermsModal() {
    let modal = document.getElementById('terms-auth-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'terms-auth-modal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
                <h3 class="text-xl font-semibold mb-2">Terms of Service</h3>
                <p class="text-textSecondary text-sm mb-6">Before entering the dashboard, review and accept Terms in the next step.</p>
                <div class="flex gap-3">
                    <button id="terms-later-btn" class="flex-1 bg-background border border-border text-textPrimary rounded-lg py-2.5">Stay Here</button>
                    <button id="terms-continue-btn" class="flex-1 bg-gradient-to-r from-secondary to-accent text-white rounded-lg py-2.5">Continue</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        modal.querySelector('#terms-later-btn').addEventListener('click', function() {
            modal.classList.add('hidden');
        });

        modal.querySelector('#terms-continue-btn').addEventListener('click', function() {
            window.location.href = './dashboard.html';
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    modal.classList.remove('hidden');
}

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
