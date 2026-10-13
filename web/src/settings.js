// Every tunable value of the test page. The GUI edits this object; values persist in localStorage
// and "copy settings" puts them on the clipboard so they can be pasted back to Claude.
import GUI from 'lil-gui';

const KEY = 'qingming-street-test-v3';

export const DEFAULTS = {
  shading: 'lambert', // lambert | toon | unlit | pbr
  exposure: 1.0,
  saturation: 0.95,
  warmth: 0.3,
  sunIntensity: 2.4,
  sunColor: '#fff0d4',
  sunAzimuth: -35, // degrees in the ground plane, 0 = +X (right), -90 = straight down the street
  sunElevation: 42,
  hemiIntensity: 1.25,
  hemiSky: '#f4e8cf',
  hemiGround: '#9a7b58',
  shadows: true,
  shadowSoftness: 2.5,
  fogColor: '#e8dbbf',
  fogNear: 30,
  fogFar: 140,
  ink: true,
  inkColor: '#3a2617',
  inkThickness: 1.0,
  inkDepth: 1.2,
  inkNormal: 1.0,
  inkThreshold: 0.3,
  inkStrength: 0.85,
  inkFadeStart: 20,
  inkFadeEnd: 70,
  grain: 0.035,
  stains: 0.05,
  vignette: 0.3,
  fov: 55,
  eyeHeight: 1.6,
  walkSpeed: 2.2,
  runMultiplier: 2.2,
  pixelRatioCap: 1.5,
  porterClip: 'walk', // walk | carry | run | idle
  porterSpeed: 1.25,
  townsmanClip: 'cycle', // cycle | idle | talk | look | walk
  willowMode: 'billboard', // billboard (painted card facing you) | cross (3 fixed cards) | meshy (AI 3D) | off
  refOpacity: 0.5,
};

// key/defaults: each page keeps its own saved tuning (the gate page passes its own)
export function loadSettings(key = KEY, defaults = DEFAULTS) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s, key = KEY) {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* private mode */ }
}

// onChange(key) is called after any edit; actions = { toggleRef }.
// opts: { title, key, defaults, street: false } — street: false leaves out the B1 page's character, willow and
// reference folders (the caller adds its own to the returned gui).
export function buildGui(s, onChange, actions, opts = {}) {
  const { title = 'Street B1 test — tuning', key: storeKey = KEY, defaults = DEFAULTS, street = true } = opts;
  const gui = new GUI({ title });
  const save = () => saveSettings(s, storeKey);
  const changed = (key) => () => { save(); onChange(key); };
  const add = (folder, key, ...args) => folder.add(s, key, ...args).onChange(changed(key));
  const col = (folder, key) => folder.addColor(s, key).onChange(changed(key));

  const look = gui.addFolder('Look');
  add(look, 'shading', ['lambert', 'toon', 'unlit', 'pbr']);
  add(look, 'exposure', 0.4, 2.0, 0.01);
  add(look, 'saturation', 0, 1.6, 0.01);
  add(look, 'warmth', -1, 1, 0.01);

  const light = gui.addFolder('Sun & shadow');
  add(light, 'sunIntensity', 0, 6, 0.05);
  col(light, 'sunColor');
  add(light, 'sunAzimuth', -180, 180, 1);
  add(light, 'sunElevation', 5, 89, 1);
  add(light, 'hemiIntensity', 0, 4, 0.05);
  col(light, 'hemiSky');
  col(light, 'hemiGround');
  add(light, 'shadows');
  add(light, 'shadowSoftness', 0, 8, 0.1);

  const ink = gui.addFolder('Ink lines');
  add(ink, 'ink');
  col(ink, 'inkColor');
  add(ink, 'inkThickness', 0.5, 3, 0.05);
  add(ink, 'inkDepth', 0, 4, 0.05);
  add(ink, 'inkNormal', 0, 4, 0.05);
  add(ink, 'inkThreshold', 0.02, 1.5, 0.01);
  add(ink, 'inkStrength', 0, 1, 0.01);
  add(ink, 'inkFadeStart', 0, 80, 1);
  add(ink, 'inkFadeEnd', 5, 150, 1);

  const paper = gui.addFolder('Silk & haze');
  add(paper, 'grain', 0, 0.2, 0.005);
  add(paper, 'stains', 0, 0.3, 0.005);
  add(paper, 'vignette', 0, 1, 0.01);
  col(paper, 'fogColor');
  add(paper, 'fogNear', 0, 60, 0.5);
  add(paper, 'fogFar', 10, 200, 1);

  const cam = gui.addFolder('Camera & walking');
  add(cam, 'fov', 30, 90, 1);
  add(cam, 'eyeHeight', 1.0, 2.2, 0.01);
  add(cam, 'walkSpeed', 0.5, 6, 0.1);
  add(cam, 'runMultiplier', 1, 4, 0.1);
  add(cam, 'pixelRatioCap', 0.5, 3, 0.05);

  const folders = [light, ink, paper, cam];
  if (street) {
    const chars = gui.addFolder('Characters & props');
    add(chars, 'porterClip', ['walk', 'carry', 'run', 'idle']);
    add(chars, 'porterSpeed', 0, 4, 0.05);
    add(chars, 'townsmanClip', ['cycle', 'idle', 'talk', 'look', 'walk']);
    add(chars, 'willowMode', ['billboard', 'cross', 'meshy', 'off']).name('willow');
    folders.push(chars);

    const ref = gui.addFolder('Reference (B1 target)');
    add(ref, 'refOpacity', 0, 1, 0.01);
    ref.add(actions, 'toggleRef').name('toggle reference view  [R]');
  }

  gui.add({ copy: () => {
    const json = JSON.stringify(s, null, 1);
    navigator.clipboard?.writeText(json).catch(() => {});
    console.log(json);
    alert('Settings copied to the clipboard (also printed in the console).');
  } }, 'copy').name('copy settings');
  gui.add({ reset: () => { Object.assign(s, defaults); save(); gui.controllersRecursive().forEach((c) => c.updateDisplay()); onChange('*'); } }, 'reset').name('reset to defaults');

  folders.forEach((f) => f.close());
  if (window.innerWidth < 700) gui.close();
  return gui;
}
