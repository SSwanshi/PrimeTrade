(function () {
  const DEMO_ACCOUNTS = {
    USER: { email: 'user@primetrade.com', password: 'password123' },
    ADMIN: { email: 'admin@primetrade.com', password: 'password123' },
  };

  function authorizeSwagger(token) {
    if (!token || !window.ui) return;
    window.ui.authActions.authorize({
      bearerAuth: {
        name: 'bearerAuth',
        schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        value: token,
      },
    });
  }

  function patchFetchForAutoAuth() {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      return originalFetch.apply(this, args).then(async (response) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        if (url.includes('/api/auth/login') && response.ok) {
          try {
            const data = await response.clone().json();
            if (data.token) {
              setTimeout(() => authorizeSwagger(data.token), 0);
            }
          } catch (_err) {
            /* ignore parse errors */
          }
        }
        return response;
      });
    };
  }

  function fillLoginCredentials(role) {
    const account = DEMO_ACCOUNTS[role];
    if (!account) return;

    document.querySelectorAll('textarea.body-param__textarea').forEach((textarea) => {
      try {
        const body = JSON.parse(textarea.value);
        if (!('role' in body) || !('email' in body)) return;
        body.role = role;
        body.email = account.email;
        body.password = account.password;
        textarea.value = JSON.stringify(body, null, 2);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (_err) {
        /* ignore non-login bodies */
      }
    });
  }

  function watchRoleChanges() {
    document.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.name !== 'role' && !target.closest('[data-property-name="role"]')) return;
      const role = target.value;
      if (role === 'USER' || role === 'ADMIN') {
        fillLoginCredentials(role);
      }
    });
  }

  patchFetchForAutoAuth();
  watchRoleChanges();
})();
