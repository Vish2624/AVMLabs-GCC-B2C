// Password login screen.
import { html } from '../html.js';
import { view } from '../ui.js';

export function LoginView({ onLogin, message = '' }) {
  let error = message;
  let busy = false;

  const { el, update } = view(() => html`
    <div class="login">
      <form class="panel" novalidate>
        <div class="brand">
          <span class="brand-mark">AVM</span>
          <div><h1>Admin</h1><p class="subtitle">AVM Labs health profiles</p></div>
        </div>
        ${error && html`<div class="alert" role="alert">${error}</div>`}
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" autocomplete="current-password" required>
        </div>
        <button class="btn primary" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>`);

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
