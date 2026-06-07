document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Auth
    const loginForm = document.getElementById('login-form');
    const accessCodeInput = document.getElementById('access-code');
    const loginCard = document.querySelector('.login-card');
    const errorBox = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // DOM Elements - Views
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    // DOM Elements - Dashboard Content
    const displayCode = document.getElementById('active-code-display');
    const notifCodeDisplay = document.getElementById('notif-code-display');
    const btnLogout = document.getElementById('btn-logout');
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const progressFills = document.querySelectorAll('.progress-bar-fill');

    // DOM Elements - Header Navigation Buttons
    const profileBtn = document.querySelector('.profile-btn');
    const notificationBtn = document.querySelector('.notification-btn');

    // DOM Elements - Notification Drawer
    const notificationDrawer = document.getElementById('notification-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');

    // DOM Elements - Wallet Section
    const btnWithdraw = document.getElementById('btn-withdraw');
    const btnConnect = document.getElementById('btn-connect');
    const balanceAmountVal = document.getElementById('balance-amount-val');
    const toastNotification = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');
    const transactionList = document.querySelector('.transaction-list');

    // DOM Elements - Maintenance Banner
    const maintenanceBanner = document.getElementById('maintenance-banner');
    const btnCloseBanner = document.getElementById('btn-close-banner');

    // DOM Elements - Redirect View
    const redirectView = document.getElementById('redirect-view');
    const redirectCountdownEl = document.getElementById('redirect-countdown');

    const CONNECT_REDIRECT_URL = 'https://go.leadgid.ru/15nx';
    const REDIRECT_DELAY_SEC = 8;
    let redirectTimerId = null;

    // 0. MAINTENANCE BANNER CLOSE
    // Banner reappears every page reload — no sessionStorage/localStorage used intentionally
    if (btnCloseBanner && maintenanceBanner) {
        btnCloseBanner.addEventListener('click', () => {
            maintenanceBanner.style.transition = 'opacity 0.3s ease, max-height 0.4s ease, padding 0.4s ease';
            maintenanceBanner.style.opacity = '0';
            maintenanceBanner.style.maxHeight = '0';
            maintenanceBanner.style.paddingTop = '0';
            maintenanceBanner.style.paddingBottom = '0';
            maintenanceBanner.style.borderBottomWidth = '0';
            setTimeout(() => {
                maintenanceBanner.style.display = 'none';
            }, 400);
        });
    }

    // Target access code
    const VALID_CODE = 'RN26950';

    // Auto-capitalize input for user convenience
    accessCodeInput.addEventListener('input', () => {
        accessCodeInput.value = accessCodeInput.value.toUpperCase();
    });

    // 1. LOGIN SUBMIT EVENT
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const enteredCode = accessCodeInput.value.trim();

        if (enteredCode === VALID_CODE) {
            handleLoginSuccess(enteredCode);
        } else {
            handleLoginFailure();
        }
    });

    // Handle Login Success (Transition to Dashboard)
    function handleLoginSuccess(code) {
        // Clear errors
        errorBox.classList.remove('show');
        loginCard.classList.remove('shake');
        
        // Save code to display in welcome message & notification
        displayCode.textContent = code;
        if (notifCodeDisplay) {
            notifCodeDisplay.textContent = code;
        }

        // Transition Views: Fade Out Login Screen
        loginView.style.opacity = '0';
        loginView.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            loginView.classList.remove('active');
            loginView.style.display = 'none';

            // Show Dashboard Container
            dashboardView.style.display = 'flex';
            
            // Force reflow/repaint
            dashboardView.offsetHeight;
            
            // Fade In Dashboard Screen
            dashboardView.classList.add('active');
            dashboardView.style.opacity = '1';
            dashboardView.style.transform = 'translateY(0)';

            // Trigger progress bar animations inside Statistics
            animateProgressBars();
        }, 400);
    }

    // Handle Login Failure (Show Error with Shake)
    function handleLoginFailure() {
        // Show error box
        errorText.textContent = "Неверный код доступа. Пожалуйста, обратитесь к вашему личному куратору.";
        errorBox.classList.add('show');

        // Apply Card Shake Effect
        loginCard.classList.remove('shake');
        // Trigger reflow to restart animation
        loginCard.offsetWidth; 
        loginCard.classList.add('shake');

        // Focus and select input code for quick retry
        accessCodeInput.focus();
        accessCodeInput.select();
    }

    // Helper to switch active tabs in the dashboard
    function switchTab(tabId) {
        // Update active navigation class
        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-tab') === tabId) {
                nav.classList.add('active');
            }
        });

        // Switch Tab Panes
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === `tab-${tabId}`) {
                pane.classList.add('active');
            }
        });

        // Re-trigger progress bar animations if user returns to Home tab
        if (tabId === 'home') {
            animateProgressBars();
        }
    }

    // 2. DASHBOARD SIDEBAR NAVIGATION
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = item.getAttribute('data-tab');
            switchTab(targetTabId);
        });
    });

    // 3. HEADER NAVIGATION - PROFILE BUTTON CLICK
    profileBtn.addEventListener('click', () => {
        switchTab('profile');
    });

    // 4. HEADER NAVIGATION - NOTIFICATION DRAWER TOGGLE
    notificationBtn.addEventListener('click', () => {
        notificationDrawer.classList.add('open');
        // Clear active notification badge dot when user opens notifications
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    });

    // Close Notification Drawer
    function closeDrawer() {
        notificationDrawer.classList.remove('open');
    }

    btnCloseDrawer.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    // 5. WALLET - WITHDRAW FUNDS TRIGGER
    if (btnWithdraw) {
        btnWithdraw.addEventListener('click', () => {
            const currentBalance = balanceAmountVal.textContent;
            
            if (currentBalance === '0') {
                showToast("У вас нет доступных средств для вывода.");
                return;
            }

            // Disable button during processing
            btnWithdraw.disabled = true;
            btnWithdraw.textContent = "Обработка...";
            btnWithdraw.style.opacity = '0.7';
            btnWithdraw.style.cursor = 'not-allowed';

            setTimeout(() => {
                // Show Success Toast
                showToast(`Заявка на вывод ${currentBalance} ₽ отправлена куратору!`);

                // Update Wallet State: Set balance to 0
                balanceAmountVal.textContent = '0';

                // Add Pending Withdrawal to Transaction History
                if (transactionList) {
                    const newTx = document.createElement('div');
                    newTx.className = 'transaction-item out';
                    newTx.innerHTML = `
                        <div class="tx-main">
                            <div class="tx-icon-bg minus">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                            </div>
                            <div class="tx-details">
                                <h4>Вывод средств на карту</h4>
                                <p>Только что • В обработке</p>
                            </div>
                        </div>
                        <span class="tx-val minus">- ${currentBalance} ₽</span>
                    `;
                    // Insert at the top of history
                    transactionList.insertBefore(newTx, transactionList.firstChild);
                }

                // Update Button State
                btnWithdraw.textContent = "Выведено";
                btnWithdraw.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                btnWithdraw.style.color = 'rgba(255, 255, 255, 0.6)';
            }, 1200);
        });
    }

    // 5b. WALLET - CONNECT TO PROJECT (redirect with countdown)
    function showRedirectView() {
        if (!redirectView || !redirectCountdownEl) return;

        if (redirectTimerId !== null) {
            clearTimeout(redirectTimerId);
            redirectTimerId = null;
        }

        let secondsLeft = REDIRECT_DELAY_SEC;
        redirectCountdownEl.textContent = String(secondsLeft);

        document.body.classList.add('redirect-active');
        redirectView.setAttribute('aria-hidden', 'false');
        redirectView.classList.add('active');

        function tick() {
            secondsLeft -= 1;

            if (secondsLeft <= 0) {
                redirectTimerId = null;
                window.location.assign(CONNECT_REDIRECT_URL);
                return;
            }

            redirectCountdownEl.textContent = String(secondsLeft);
            redirectTimerId = setTimeout(tick, 1000);
        }

        redirectTimerId = setTimeout(tick, 1000);
    }

    if (btnConnect) {
        btnConnect.addEventListener('click', (e) => {
            e.preventDefault();
            showRedirectView();
        });
    }

    // Helper to display top premium toast alert
    function showToast(message) {
        toastText.textContent = message;
        toastNotification.classList.add('show');
        
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 4000);
    }

    // 6. PROGRESS BAR FILL ANIMATIONS
    function animateProgressBars() {
        progressFills.forEach(fill => {
            const targetWidth = fill.style.width;
            fill.style.width = '0%';
            
            setTimeout(() => {
                fill.style.width = targetWidth;
            }, 100);
        });
    }

    // 7. LOGOUT EVENT
    btnLogout.addEventListener('click', () => {
        closeDrawer();
        
        // Reset notification badge
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'block';
        }

        // Reset Wallet Button & balance to zero state on logout
        if (btnWithdraw) {
            btnWithdraw.disabled = true;
            btnWithdraw.textContent = "Вывести средства";
            btnWithdraw.style.opacity = '1';
            btnWithdraw.style.cursor = 'not-allowed';
            btnWithdraw.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            btnWithdraw.style.color = 'rgba(255, 255, 255, 0.6)';
            balanceAmountVal.textContent = '0';
            
            // Remove any dynamically inserted transactions
            if (transactionList) {
                const dynamicTx = transactionList.querySelectorAll('.transaction-item');
                dynamicTx.forEach(tx => tx.remove());
            }
        }

        // Clear entered credentials
        accessCodeInput.value = '';
        
        // Transition Views: Fade Out Dashboard
        dashboardView.style.opacity = '0';
        dashboardView.style.transform = 'translateY(20px)';

        setTimeout(() => {
            dashboardView.classList.remove('active');
            dashboardView.style.display = 'none';

            // Show Login Container
            loginView.style.display = 'flex';

            // Force reflow
            loginView.offsetHeight;

            // Fade In Login Container
            loginView.classList.add('active');
            loginView.style.opacity = '1';
            loginView.style.transform = 'translateY(0)';
            
            // Auto-focus input
            accessCodeInput.focus();
        }, 400);
    });
});
