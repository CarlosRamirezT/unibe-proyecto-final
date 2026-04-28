window.addEventListener('load', function() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) {
        return;
    }

    const submitButton = signupForm.querySelector('button[type="submit"]');
    const messageBox = ensureMessageBox(signupForm);

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const email = document.getElementById('email').value;

        if (password !== confirmPassword) {
            showMessage(messageBox, 'Passwords do not match!', true);
            return;
        }

        const terms = document.getElementById('terms').checked;
        if (!terms) {
            showMessage(messageBox, 'Please accept the Terms of Service and Privacy Policy.', true);
            return;
        }

        setLoading(submitButton, true, 'Creating account...');
        showMessage(messageBox, '');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const payload = await tryParseJson(response);
            if (!response.ok) {
                const message = payload?.error || 'Unable to register right now. Please try again.';
                showMessage(messageBox, message, true);
                return;
            }

            showMessage(messageBox, 'Account created successfully. Redirecting to login...');
            window.setTimeout(function() {
                window.location.href = './login.html?registered=1';
            }, 700);
        } catch {
            showMessage(messageBox, 'Network error. Please try again.', true);
        } finally {
            setLoading(submitButton, false, 'Create Account');
        }
    });
});

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function ensureMessageBox(form) {
    let box = document.getElementById('signup-message');
    if (!box) {
        box = document.createElement('p');
        box.id = 'signup-message';
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
