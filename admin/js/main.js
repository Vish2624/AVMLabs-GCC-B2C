// Admin app: decides which screen to show and talks to the API.
import { api } from './api.js';
import { toast } from './ui.js';
import { CentresView } from './views/centres.js';
import { LoginView } from './views/login.js';
import { ProfileEditorView } from './views/profile-editor.js';
import { ProfileListView } from './views/profile-list.js';
import { SubProfileEditorView } from './views/subprofile-editor.js';
import { SubProfileListView } from './views/subprofile-list.js';
import { TestEditorView } from './views/test-editor.js';
import { TestListView } from './views/test-list.js';

const app = document.getElementById('app');
let catalog = null;
let profiles = [];
let subProfiles = [];

const show = (el) => {
  app.replaceChildren(el);
  window.scrollTo(0, 0);
};

// The open screen lives in the URL hash (#new, #edit/<id>, #subs…, #tests, #tests/new, #tests/edit/<id>, #centres)
// so a refresh reopens it.
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

// Loads profiles and sub-profiles (and the catalogue once). False if the screen already changed.
async function load() {
  try {
    return !!(await guard(async () => {
      // The catalogue holds the tests, which can change in the admin, so it's reloaded too.
      [catalog, profiles, subProfiles] = await Promise.all([api.catalog(), api.listProfiles(), api.listSubProfiles()]);
      return true;
    }));
  } catch (err) {
    showError(err);
    return false;
  }
}

const logout = async () => {
  await api.logout().catch(() => {});
  showLogin();
};
const onTab = (tab) =>
  tab === 'subs' ? showSubList() : tab === 'tests' ? showTestList() : tab === 'centres' ? showCentres() : showList();

// Runs a delete; true once it's gone and the list is showing again.
async function remove(fn, done, back) {
  let deleted = false;
  try {
    await guard(async () => {
      await fn();
      deleted = true;
    });
  } catch (err) {
    toast(err.message);
    return false;
  }
  if (!deleted) return false; // session ended; the login screen is showing
  toast(done);
  await back();
  return true;
}

async function showList() {
  if (!(await load())) return;
  show(
    ProfileListView({ profiles, catalog, onNew: () => showEditor(null), onEdit: showEditor, onTab, onLogout: logout }),
  );
  setHash('');
}

function showEditor(profile) {
  show(
    ProfileEditorView({
      profile,
      catalog,
      subProfiles,
      nextSortOrder: profiles.reduce((max, p) => Math.max(max, p.sortOrder + 1), 0),
      onClose: showList,
      onManageSubs: showSubList,
      onDelete: (id) => remove(() => api.deleteProfile(id), 'Profile deleted', showList),
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

async function showSubList() {
  if (!(await load())) return;
  show(
    SubProfileListView({
      subProfiles,
      profiles,
      catalog,
      onNew: () => showSubEditor(null),
      onEdit: showSubEditor,
      onTab,
      onLogout: logout,
    }),
  );
  setHash('subs');
}

function showSubEditor(sub) {
  show(
    SubProfileEditorView({
      sub,
      profiles,
      catalog,
      onClose: showSubList,
      onDelete: (id) => remove(() => api.deleteSubProfile(id), 'Sub-profile deleted', showSubList),
      onSave: async (payload, id) => {
        const saved = await guard(() => (id ? api.updateSubProfile(id, payload) : api.createSubProfile(payload)));
        if (!saved) return;
        toast(id ? 'Sub-profile saved' : 'Sub-profile created');
        await showSubList();
      },
    }),
  );
  setHash(sub ? 'subs/edit/' + sub.id : 'subs/new');
}

async function showTestList() {
  if (!(await load())) return;
  show(
    TestListView({
      catalog,
      subProfiles,
      profiles,
      onNew: () => showTestEditor(null),
      onEdit: showTestEditor,
      onTab,
      onLogout: logout,
    }),
  );
  setHash('tests');
}

function showTestEditor(test) {
  if (catalog.testsReadOnly) return toast(catalog.testsReadOnly);
  show(
    TestEditorView({
      test,
      catalog,
      subProfiles,
      profiles,
      onClose: showTestList,
      onDelete: (id) => remove(() => api.deleteTest(id), 'Test deleted', showTestList),
      onSave: async (payload, isNew) => {
        const saved = await guard(() => (isNew ? api.createTest(payload) : api.updateTest(payload)));
        if (!saved) return;
        toast(isNew ? 'Test added' : 'Test saved');
        await showTestList();
      },
    }),
  );
  setHash(test ? 'tests/edit/' + encodeURIComponent(test.id) : 'tests/new');
}

async function showCentres() {
  if (!(await load())) return;
  show(
    CentresView({
      catalog,
      onTab,
      onLogout: logout,
      // Resolves to the saved list, or undefined if the session ended.
      onSave: async (centres) => {
        const saved = await guard(() => api.saveCentres(centres));
        if (!saved) return undefined;
        catalog.centres = saved;
        toast('Centres saved. The website shows them within about 5 minutes.');
        return saved;
      },
    }),
  );
  setHash('centres');
}

// Reopens the screen named in the hash once the lists have loaded.
function openRoute(route) {
  if (!catalog) return; // the lists failed to load
  if (route === 'new') return showEditor(null);
  if (route === 'subs') return showSubList();
  if (route === 'tests') return showTestList();
  if (route === 'centres') return showCentres();
  if (route === 'tests/new') return catalog.testsReadOnly ? showTestList() : showTestEditor(null);
  if (route.startsWith('tests/edit/')) {
    const test = catalog.tests.find((t) => t.id === decodeURIComponent(route.slice(11)));
    return test && !catalog.testsReadOnly ? showTestEditor(test) : showTestList();
  }
  if (route === 'subs/new') return showSubEditor(null);
  if (route.startsWith('subs/edit/')) {
    const sub = subProfiles.find((s) => String(s.id) === route.slice(10));
    return sub ? showSubEditor(sub) : showSubList();
  }
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
