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

// The open screen lives in the URL hash (#new, #edit/<id>) so a refresh reopens it.
const setHash = (h) => {
  if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
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
  show(
    LoginView({
      message,
      onLogin: async (password) => {
        await api.login(password);
        await showList();
      },
    }),
  );
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

  show(
    ProfileListView({
      profiles,
      catalog,
      onNew: () => showEditor(null),
      onEdit: (profile) => showEditor(profile),
      onLogout: async () => {
        await api.logout().catch(() => {});
        showLogin();
      },
    }),
  );
  setHash('');
}

function showEditor(profile) {
  show(
    ProfileEditorView({
      profile,
      catalog,
      nextSortOrder: profiles.reduce((max, p) => Math.max(max, p.sortOrder + 1), 0),
      onClose: showList,
      onDelete: async (id) => {
        let deleted = false;
        try {
          await guard(async () => {
            await api.deleteProfile(id);
            deleted = true;
          });
        } catch (err) {
          toast(err.message);
          return false;
        }
        if (!deleted) return false; // session ended; the login screen is showing
        toast('Profile deleted');
        await showList();
        return true;
      },
      onSave: async (payload, isNew) => {
        const saved = await guard(() => (isNew ? api.createProfile(payload) : api.updateProfile(payload)));
        if (!saved) return;
        toast(isNew ? 'Profile created' : 'Profile saved');
        await showList();
      },
    }),
  );
  setHash(profile ? 'edit/' + encodeURIComponent(profile.id) : 'new');
}

// Reopens the screen named in the hash once the profiles have loaded.
function openRoute(route) {
  if (!catalog) return; // the list failed to load
  if (route === 'new') return showEditor(null);
  const id = route.startsWith('edit/') && decodeURIComponent(route.slice(5));
  const profile = id && profiles.find((p) => p.id === id);
  if (profile) showEditor(profile);
}

async function start() {
  const route = location.hash.slice(1);
  try {
    const { authed } = await api.session();
    if (authed) {
      await showList();
      openRoute(route);
    } else showLogin();
  } catch (err) {
    showError(err);
  }
}

start();
