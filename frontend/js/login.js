// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const loginButton = document.getElementById('login-button');
    const togglePasswordButton = document.getElementById('togglePassword');
    const userErrorSpan = document.getElementById('user-error');
    const passErrorSpan = document.getElementById('pass-error');

    // ... (密码可见性切换和记住我功能保持不变) ...

    // 1. 密码可见性切换
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', () => {
            const icon = togglePasswordButton.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('ri-eye-off-line');
                icon.classList.add('ri-eye-line');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('ri-eye-line');
                icon.classList.add('ri-eye-off-line');
            }
        });
    }

    // 2. "记住我" 功能 - 页面加载时检查
    if (localStorage.getItem('rememberedUsername')) {
        usernameInput.value = localStorage.getItem('rememberedUsername');
        rememberCheckbox.checked = true;
    }


    // 3. 登录表单提交处理
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearErrors();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            let isValid = true;

            if (username === '') {
                showError(usernameInput, userErrorSpan, '账号不能为空');
                isValid = false;
            }
            if (password === '') {
                showError(passwordInput, passErrorSpan, '密码不能为空');
                isValid = false;
            }

            if (!isValid) return;

            loginButton.disabled = true;
            loginButton.textContent = '登录中...';

            try {
                // Django API的URL (确保端口和路径正确)
                const response = await fetch('http://124.222.225.80:8000/api/accounts/login/', { // 修改为你的Django服务器地址
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) { // HTTP status 200-299
                    alert(data.message || '登录成功！');

                    if (rememberCheckbox.checked) {
                        localStorage.setItem('rememberedUsername', username);
                    } else {
                        localStorage.removeItem('rememberedUsername');
                    }

                    // 存储 token (access token)
                    sessionStorage.setItem('accessToken', data.access_token);
                    sessionStorage.setItem('refreshToken', data.refresh_token);
                    if (data.user && data.user.username) {
                        sessionStorage.setItem('loggedInUser', data.user.username);
                    }

                    // 跳转到主页或仪表盘
                    window.location.href = 'dashboard.html';

                } else {
                    // 处理后端返回的错误信息
                    let errorMessage = '登录失败，请重试。';
                    if (data.error) {
                        errorMessage = data.error;
                    } else if (data.detail) { // DRF 有时用 detail
                        errorMessage = data.detail;
                    }

                    // 根据错误类型显示在特定字段或通用位置
                    if (response.status === 401) { // Unauthorized (Invalid credentials)
                        showError(passwordInput, passErrorSpan, errorMessage);
                    } else if (response.status === 400 && data.username) { // Bad request, specific field error
                        showError(usernameInput, userErrorSpan, data.username.join(' '));
                    } else if (response.status === 400 && data.password) {
                        showError(passwordInput, passErrorSpan, data.password.join(' '));
                    }
                    else {
                        // 通用错误，可以显示在密码下方或一个全局错误提示区
                        showError(loginButton, passErrorSpan, errorMessage); // passErrorSpan可能不是最佳位置
                    }
                    // alert(errorMessage); // 也可以用alert
                }

            } catch (error) {
                console.error('登录请求失败:', error);
                showError(loginButton, passErrorSpan, '服务暂时不可用，请检查网络或稍后再试。');
                // alert('登录请求失败，请检查网络或稍后再试。');
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = '登录';
            }
        });
    }

    function showError(inputElement, errorSpan, message) {
        // 如果inputElement是按钮，我们不给它添加input-error类
        if (inputElement && inputElement.tagName === 'INPUT') {
            inputElement.classList.add('input-error');
        }
        if (errorSpan) errorSpan.textContent = message;
    }

    function clearErrors() {
        userErrorSpan.textContent = '';
        passErrorSpan.textContent = '';
        usernameInput.classList.remove('input-error');
        passwordInput.classList.remove('input-error');
    }
});

// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Login Form Logic ---
    const loginForm = document.querySelector('.login-form:not(#registerForm)'); // More specific selector
    const usernameLoginInput = document.getElementById('username'); // Assuming these are for login
    const passwordLoginInput = document.getElementById('password'); // Assuming these are for login
    const rememberCheckbox = document.getElementById('remember');
    const loginButton = document.getElementById('login-button');
    const togglePasswordLoginButton = document.getElementById('togglePassword');
    const userLoginErrorSpan = document.getElementById('user-error'); // For login form
    const passLoginErrorSpan = document.getElementById('pass-error');   // For login form

    if (togglePasswordLoginButton) {
        togglePasswordLoginButton.addEventListener('click', () => {
            // ... (your existing toggle password logic for login form)
            const icon = togglePasswordLoginButton.querySelector('i');
            if (passwordLoginInput.type === 'password') {
                passwordLoginInput.type = 'text';
                icon.classList.remove('ri-eye-off-line');
                icon.classList.add('ri-eye-line');
            } else {
                passwordLoginInput.type = 'password';
                icon.classList.remove('ri-eye-line');
                icon.classList.add('ri-eye-off-line');
            }
        });
    }

    if (localStorage.getItem('rememberedUsername') && usernameLoginInput) { // Check if element exists
        usernameLoginInput.value = localStorage.getItem('rememberedUsername');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // ... (your existing login form submission logic) ...
            event.preventDefault();
            clearLoginErrors(); // Make sure you have a clearLoginErrors function

            const username = usernameLoginInput.value.trim();
            const password = passwordLoginInput.value.trim();
            let isValid = true;

            if (username === '') {
                showLoginError(usernameLoginInput, userLoginErrorSpan, '账号不能为空');
                isValid = false;
            }
            if (password === '') {
                showLoginError(passwordLoginInput, passLoginErrorSpan, '密码不能为空');
                isValid = false;
            }

            if (!isValid) return;

            loginButton.disabled = true;
            loginButton.textContent = '登录中...';

            try {
                const response = await fetch('http://127.0.0.1:8000/api/accounts/login/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || '登录成功！');
                    if (rememberCheckbox && rememberCheckbox.checked) {
                        localStorage.setItem('rememberedUsername', username);
                    } else {
                        localStorage.removeItem('rememberedUsername');
                    }
                    sessionStorage.setItem('accessToken', data.access_token);
                    sessionStorage.setItem('refreshToken', data.refresh_token);
                    if (data.user && data.user.username) {
                        sessionStorage.setItem('loggedInUser', data.user.username);
                    }
                    window.location.href = 'index.html';
                } else {
                    let errorMessage = data.error || data.detail || '登录失败，请重试。';
                    showLoginError(passwordLoginInput, passLoginErrorSpan, errorMessage);
                }
            } catch (error) {
                console.error('登录请求失败:', error);
                showLoginError(loginButton, passLoginErrorSpan, '服务暂时不可用，请检查网络或稍后再试。');
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = '登录';
            }
        });
    }

    function showLoginError(inputElement, errorSpan, message) {
        if (inputElement && inputElement.tagName === 'INPUT') {
            inputElement.classList.add('input-error');
        }
        if (errorSpan) errorSpan.textContent = message;
    }

    function clearLoginErrors() {
        if(userLoginErrorSpan) userLoginErrorSpan.textContent = '';
        if(passLoginErrorSpan) passLoginErrorSpan.textContent = '';
        if(usernameLoginInput) usernameLoginInput.classList.remove('input-error');
        if(passwordLoginInput) passwordLoginInput.classList.remove('input-error');
    }


    // --- Registration Form Logic ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const usernameRegInput = registerForm.querySelector('#username');
        const emailRegInput = registerForm.querySelector('#email');
        const passwordRegInput = registerForm.querySelector('#password');
        const password2RegInput = registerForm.querySelector('#password2');
        const registerButton = registerForm.querySelector('button[type="submit"]');

        const userRegErrorSpan = registerForm.querySelector('#user-error');
        const emailRegErrorSpan = registerForm.querySelector('#email-error');
        const passRegErrorSpan = registerForm.querySelector('#pass-error');
        const pass2RegErrorSpan = registerForm.querySelector('#pass2-error');
        const formRegErrorSpan = registerForm.querySelector('#form-error');

        const togglePassword1Button = document.getElementById('togglePassword1');
        const togglePassword2Button = document.getElementById('togglePassword2');

        // Password visibility for registration form
        if (togglePassword1Button) {
            togglePassword1Button.addEventListener('click', () => {
                togglePasswordVisibility(passwordRegInput, togglePassword1Button);
            });
        }
        if (togglePassword2Button) {
            togglePassword2Button.addEventListener('click', () => {
                togglePasswordVisibility(password2RegInput, togglePassword2Button);
            });
        }

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearRegisterErrors();

            const username = usernameRegInput.value.trim();
            const email = emailRegInput.value.trim();
            const password = passwordRegInput.value.trim();
            const password2 = password2RegInput.value.trim();
            let isValid = true;

            // Frontend Validation
            if (username === '') {
                showRegisterError(usernameRegInput, userRegErrorSpan, '用户名不能为空');
                isValid = false;
            } else if (username.length < 3) {
                showRegisterError(usernameRegInput, userRegErrorSpan, '用户名至少需要3个字符');
                isValid = false;
            }

            if (email === '') {
                showRegisterError(emailRegInput, emailRegErrorSpan, '邮箱不能为空');
                isValid = false;
            } else if (!isValidEmail(email)) {
                showRegisterError(emailRegInput, emailRegErrorSpan, '请输入有效的邮箱地址');
                isValid = false;
            }

            if (password === '') {
                showRegisterError(passwordRegInput, passRegErrorSpan, '密码不能为空');
                isValid = false;
            } else if (password.length < 8) {
                showRegisterError(passwordRegInput, passRegErrorSpan, '密码至少需要8个字符');
                isValid = false;
            }

            if (password2 === '') {
                showRegisterError(password2RegInput, pass2RegErrorSpan, '请确认密码');
                isValid = false;
            } else if (password !== password2) {
                showRegisterError(password2RegInput, pass2RegErrorSpan, '两次输入的密码不一致');
                isValid = false;
            }

            if (!isValid) return;

            registerButton.disabled = true;
            registerButton.textContent = '注册中...';

            try {
                const response = await fetch('http://127.0.0.1:8000/api/accounts/register/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password, password2 })
                });

                const data = await response.json();

                if (response.status === 201) { // HTTP 201 Created
                    alert(data.message || '注册成功！请前往登录。');
                    formRegErrorSpan.textContent = ''; // Clear any previous form errors
                    registerForm.reset(); // Clear the form
                    // Optionally redirect to login page
                    window.location.href = 'login.html';
                } else {
                    // Handle backend validation errors
                    if (data.error) {
                        if (data.error.toLowerCase().includes('username')) {
                            showRegisterError(usernameRegInput, userRegErrorSpan, data.error);
                        } else if (data.error.toLowerCase().includes('email')) {
                            showRegisterError(emailRegInput, emailRegErrorSpan, data.error);
                        } else if (data.error.toLowerCase().includes('password')) {
                            showRegisterError(passwordRegInput, passRegErrorSpan, data.error);
                        } else if (data.error.toLowerCase().includes('match')) {
                            showRegisterError(password2RegInput, pass2RegErrorSpan, data.error);
                        }
                        else {
                            formRegErrorSpan.textContent = data.error;
                        }
                    } else {
                        formRegErrorSpan.textContent = '注册失败，请稍后重试。';
                    }
                }
            } catch (error) {
                console.error('注册请求失败:', error);
                formRegErrorSpan.textContent = '服务暂时不可用，请检查网络或稍后再试。';
            } finally {
                registerButton.disabled = false;
                registerButton.textContent = '注册';
            }
        });

        function showRegisterError(inputElement, errorSpan, message) {
            if (inputElement) inputElement.classList.add('input-error');
            if (errorSpan) errorSpan.textContent = message;
        }

        function clearRegisterErrors() {
            userRegErrorSpan.textContent = '';
            emailRegErrorSpan.textContent = '';
            passRegErrorSpan.textContent = '';
            pass2RegErrorSpan.textContent = '';
            formRegErrorSpan.textContent = '';

            usernameRegInput.classList.remove('input-error');
            emailRegInput.classList.remove('input-error');
            passwordRegInput.classList.remove('input-error');
            password2RegInput.classList.remove('input-error');
        }

        function isValidEmail(email) {
            // Basic email validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function togglePasswordVisibility(passwordInput, toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('ri-eye-off-line');
                icon.classList.add('ri-eye-line');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('ri-eye-line');
                icon.classList.add('ri-eye-off-line');
            }
        }
    } // End of if (registerForm)
});