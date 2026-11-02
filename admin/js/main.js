// Admin app: decides which screen to show and talks to the API.
import { api } from './api.js';
import { toast } from './ui.js';
import { LoginView } from './views/login.js';
import { ProfileEditorView } from './views/profile-editor.js';
import { ProfileListView } from './views/profile-list.js';

const app = document.getElementById('app');
let catalog = null;
let profiles = [];

const show = (el) => {
  app.replaceChildren(el);
  window.scrollTo(0, 0);
};

// Any request can find the session expired; send the user back to login.
async function guard(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.status === 401) {
      showLogin('Your session has ended. Please sign in again.');
      return undefined;
    }
    throw err;
  }
}

function showLogin(message) {
  show(LoginView({
    message,
    onLogin: async (password) => {
      await api.login(password);
      await showList();
    },
  }));
}

function showError(err) {
  const p = document.createElement('p');
  p.className = 'loading';
  p.textContent = `Couldn't load profiles: ${err.message}`;
  show(p);
}

async function showList() {
  let loaded;
  try {
    loaded = await guard(async () => {
      [catalog, profiles] = await Promise.all([catalog || api.catalog(), api.listProfiles()]);
      return true;
    });
  } catch (err) {
    return showError(err);
  }
  if (!loaded) return;

  show(ProfileListView({
    profiles,
    catalog,
    onNew: () => showEditor(null),
    onEdit: (profile) => showEditor(profile),
    onDelete: async (id) => {
      try {
        await guard(() => api.deleteProfile(id));
        profiles = profiles.filter((p) => p.id !== id);
        toast('Profile deleted');
        return true;
      } catch (err) {
        toast(err.message);
        return false;
      }
    },
    onLogout: async () => {
      await api.logout().catch(() => {});
      showLogin();
    },
  }));
}

function showEditor(profile) {
  show(ProfileEditorView({
    profile,
    catalog,
    nextSortOrder: profiles.reduce((max, p) => Math.max(max, p.sortOrder + 1), 0),
    onClose: showList,
    onSave: async (payload, isNew) => {
      const saved = await guard(() => (isNew ? api.createProfile(payload) : api.updateProfile(payload)));
      if (!saved) return;
      toast(isNew ? 'Profile created' : 'Profile saved');
      await showList();
    },
  }));
}

async function start() {
  try {
    const { authed } = await api.session();
    if (authed) await showList();
    else showLogin();
  } catch (err) {
    showError(err);
  }
}

start();
