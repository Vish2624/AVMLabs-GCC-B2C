// Password login screen.
import { html } from '../html.js';
import { icon, view } from '../ui.js';

export function LoginView({ onLogin, message = '' }) {
  let error = message;
  let busy = false;

  const { el, update } = view(
    () => html`
    <div class="login">
      <form class="login-card" novalidate>
        <div class="logo"><img src="/assets/avm-logo.png" alt="AVM Labs — Wellness Laboratory"></div>
        <div><h1>Admin sign in</h1><p class="subtitle">Manage the health profiles on the website.</p></div>
        ${error && html`<div class="alert" role="alert">${error}</div>`}
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" autocomplete="current-password" placeholder="Enter admin password" required>
        </div>
        <button class="btn primary" type="submit" ${busy ? 'disabled' : ''}>${icon('lock')}${busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>`,
  );

  el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = el.querySelector('#password').value;
    if (!password) {
      error = 'Enter the admin password.';
      return update('#password');
    }
    busy = true;
    error = '';
    update();
    try {
      await onLogin(password);
    } catch (err) {
      busy = false;
      error = err.message;
      update('#password');
    }
  });

  update('#password');
  return el;
}
