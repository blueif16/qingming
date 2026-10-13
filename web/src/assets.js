// Shared GPU resources for the streamed world (world.js), counted by reference so a section that unloads frees what
// only it used and leaves what others still use: textures by URL (the kit's swatches in assets/tex/, tree cards,
// backdrop panels). The sections' GLBs point at the kit's swatches by URI; the plugin below gives every section
// that uses a swatch the same texture, instead of one per GLB (THREE.Cache is off: it kept every GLB's bytes and
// every image for the life of the page).
// KTX2: tools/ktx2.mjs encodes a KTX2 (Basis Universal) copy next to each webp and lists it in assets/ktx2.json; the
// cache loads the copy instead of the webp for the kinds the manifest adopts (after a side-by-side review), so the
// GPU holds 4-8 bits a pixel instead of 32. ?ktx2=0 loads no copy, ?ktx2=all every copy (the review's A/B). The
// transcoder ships with the page (public/basis/, from three's examples/jsm/libs/basis) and is fetched only when a
// copy is used. A copy can't be read back on the CPU, so it carries its image's mean colour (palette.js) and its
// webp's size (backdrop.js) from the manifest.
import * as THREE from 'three';
import { LoaderUtils } from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

// Images decode off the main thread (createImageBitmap) where three's own GLTFLoader trusts it: not in Safari, whose
// ImageBitmap options are unreliable; there they decode as before, when first drawn.
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const firefox = /Firefox\/(\d+)/.exec(ua);
export const BITMAPS = typeof createImageBitmap !== 'undefined' && !/^((?!chrome|android).)*safari/i.test(ua) && !(firefox && +firefox[1] < 98);

export class TextureCache {
  constructor() {
    this.entries = new Map(); // key -> { n, promise, tex }
    this.loader = new THREE.TextureLoader();
    // the same pixels TextureLoader gives (flipY, straight alpha), decoded in the background
    this.bitmaps = BITMAPS ? new THREE.ImageBitmapLoader().setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' }) : null;
  }

  // make() -> Promise<Texture>, called once per key while anyone holds it
  acquire(key, make) {
    let e = this.entries.get(key);
    if (!e) {
      e = { n: 0, tex: null };
      e.promise = make().then((t) => { e.tex = t; return t; });
      e.promise.catch(() => this.entries.get(key) === e && this.entries.delete(key));
      this.entries.set(key, e);
    }
    e.n++;
    return e.promise;
  }

  release(key) {
    const e = this.entries.get(key);
    if (!e || --e.n > 0) return;
    this.entries.delete(key);
    e.promise.then((t) => {
      t.dispose();
      if (typeof ImageBitmap !== 'undefined' && t.image instanceof ImageBitmap) t.image.close();
    }, () => {});
  }

  // the manifest (assets/ktx2.json) and the ?ktx2= setting: which webps are taken from their KTX2 copies
  useKtx2(manifest, renderer, setting = null) {
    const kinds = Object.entries(manifest?.kinds || {}).filter(([, v]) => setting === 'all' || (setting !== '0' && v.adopt)).map(([k]) => k);
    this.ktx = new Map(Object.entries(manifest?.files || {}).filter(([, e]) => kinds.includes(e.kind)));
    this.embedded = [...this.ktx.keys()].some((k) => k.startsWith('emb:')); // copies of images inside GLBs
    this.loose = new Set(); // KTX2 copies the cache doesn't hold (a model's own textures), for restoreKtx
    if (this.ktx.size) this.ktx2Loader = new KTX2Loader().setTranscoderPath('basis/').detectSupport(renderer);
    return kinds;
  }
  ktxFor(url) { return this.ktx?.get(url.replace(/^(\.\/)?assets\//, '')) || null; }
  async loadKtx(e) {
    const t = await this.ktx2Loader.loadAsync(`assets/${e.ktx2}`);
    Object.assign(t.userData, { mean: e.mean, srcSize: e.src_px, ktx2: e.mode, ktxUrl: `assets/${e.ktx2}` });
    // once on the GPU, the transcoded levels are dropped from the JS heap (they are the size of the GPU copy); if
    // the GL context is lost, restoreKtx() transcodes them again
    t.onUpdate = () => { for (const m of t.mipmaps) m.data = null; };
    return t;
  }

  // after a lost GL context comes back: every KTX2 copy in use transcoded again and re-uploaded
  async restoreKtx() {
    for (const t of [...[...this.entries.values()].map((e) => e.tex), ...this.loose]) {
      if (!t?.userData.ktxUrl) continue;
      const fresh = await this.ktx2Loader.loadAsync(t.userData.ktxUrl);
      t.mipmaps = fresh.mipmaps;
      t.needsUpdate = true;
    }
  }

  // a standalone image (tree card, panel): flipY as TextureLoader's (rows bottom-up; a KTX2 copy is stored flipped)
  image(url) {
    return this.acquire(url, async () => {
      const e = this.ktxFor(url);
      if (e) return this.loadKtx(e);
      if (!this.bitmaps) return this.loader.loadAsync(url);
      const t = new THREE.Texture(await this.bitmaps.loadAsync(url));
      t.flipY = false; // flipped when decoded
      t.needsUpdate = true;
      return t;
    });
  }

  stats() { return { textures: this.entries.size, refs: [...this.entries.values()].reduce((a, e) => a + e.n, 0) }; }
}

// A GLTFLoader plugin that replaces three's own EXT_texture_webp handler (same name, so it takes its slot): a texture
// whose image is a file of its own (the kit's swatches) comes from the cache, one per URL for every GLB, and the
// parser remembers the URLs it took (parser.sharedTextures) so the section can give them back when it unloads.
// Embedded images (characters, animals) load as before.
export function sharedTexturePlugin(cache) {
  return (parser) => ({
    name: 'EXT_texture_webp',
    loadTexture(textureIndex) {
      const json = parser.json, def = json.textures[textureIndex];
      const ext = def.extensions?.EXT_texture_webp;
      if (!ext) return null;
      const src = json.images[ext.source];
      // an image inside the GLB (a character's or animal's body): its KTX2 copy, found by its bytes, if adopted
      if (!src.uri && cache.embedded && src.bufferView !== undefined) {
        return parser.getDependency('bufferView', src.bufferView).then((buf) => {
          const e = cache.ktx.get(embKey(new Uint8Array(buf)));
          if (!e) return parser.loadTextureImage(textureIndex, ext.source, parser.textureLoader);
          return cache.loadKtx(e).then((t) => { cache.loose.add(t); t.addEventListener('dispose', () => cache.loose.delete(t)); return gltfSampler(t, json, def, src); });
        });
      }
      if (!src.uri) return parser.loadTextureImage(textureIndex, ext.source, parser.textureLoader);
      const url = LoaderUtils.resolveURL(src.uri, parser.options.path);
      (parser.sharedTextures ||= []).push(url);
      const e = cache.ktxFor(url);
      if (e) return cache.acquire(url, () => cache.loadKtx(e).then((t) => gltfSampler(t, json, def, src)));
      return cache.acquire(url, () => parser.loadTextureImage(textureIndex, ext.source, parser.textureLoader));
    },
  });
}

// what GLTFLoader gives a texture it loads itself: its name and the glTF sampler's wrapping and filters (a KTX2 copy
// carries its own mipmaps; glTF images are not flipped, and neither is a kit swatch's copy)
const WRAP = { 33071: THREE.ClampToEdgeWrapping, 33648: THREE.MirroredRepeatWrapping, 10497: THREE.RepeatWrapping };
const FILTER = { 9728: THREE.NearestFilter, 9729: THREE.LinearFilter, 9984: THREE.NearestMipmapNearestFilter, 9985: THREE.LinearMipmapNearestFilter,
  9986: THREE.NearestMipmapLinearFilter, 9987: THREE.LinearMipmapLinearFilter };
function gltfSampler(t, json, def, src) {
  const sm = json.samplers?.[def.sampler] || {};
  t.name = src.name || '';
  t.flipY = false;
  t.wrapS = WRAP[sm.wrapS] ?? THREE.RepeatWrapping;
  t.wrapT = WRAP[sm.wrapT] ?? THREE.RepeatWrapping;
  t.magFilter = FILTER[sm.magFilter] ?? THREE.LinearFilter;
  t.minFilter = t.mipmaps?.length > 1 ? FILTER[sm.minFilter] ?? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  return t;
}

// an embedded image's key in the manifest (tools/ktx2.mjs): its byte length and FNV-1a hash
export function embKey(bytes) {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193); }
  return `emb:${bytes.length}:${(h >>> 0).toString(16).padStart(8, '0')}`;
}
