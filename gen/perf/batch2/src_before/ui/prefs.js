// The player's UI preferences (gen/ui/STYLE.md), kept apart from world.js's tuning object `s` (settings.js). Shared
// by the settings screen (it edits them) and the parts that read them (places, help, talk). Saved in localStorage,
// which may be missing (private mode, previews), so every read and write is guarded and the defaults always work.
//   import { prefs } from './prefs.js';
//   prefs.get('expandDescriptions')   prefs.set('expandDescriptions', true)   prefs.on('expandDescriptions', fn)
const KEY = 'qingming-ui-prefs-v1';

export const PREF_DEFAULTS = {
  expandDescriptions: false, // landmark toasts open with their long description (true) or only name + one line (false)
  helpSeen: false,           // the controls help has been shown once in full
  placeNotes: true,          // region banners and landmark toasts (settings 介面; settings agent)
  plaques: true,             // the white plaques hung over landmarks (settings 介面; settings agent)
  discovered: [],            // the 圖志 journal (lore agent, places.js): landmark map IDs reached, 'r:<region id>' entered,
                             // 't:<talk scene id>' heard, in the order found; never a count on screen
  lastPlace: null,           // the landmark reached last (its toast); J opens the journal there
};

const load = () => {
  try { return { ...PREF_DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...PREF_DEFAULTS }; }
};
const values = load();
const listeners = new Map(); // key -> Set(fn); '*' hears every change

export const prefs = {
  get: (k) => values[k],
  all: () => ({ ...values }),
  set(k, v) {
    if (values[k] === v) return;
    values[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(values)); } catch { /* not saved; still applies */ }
    for (const fn of [...(listeners.get(k) || []), ...(listeners.get('*') || [])]) { try { fn(v, k); } catch (e) { console.error(e); } }
  },
  on(k, fn) {
    if (!listeners.has(k)) listeners.set(k, new Set());
    listeners.get(k).add(fn);
    return () => listeners.get(k).delete(fn);
  },
};
