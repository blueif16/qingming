// The true-colour palette of the world's materials. Our painted swatches were made in the style of the scroll, so
// they carry its aged-silk yellow; the town itself had grey brick and stone, grey tile roofs, white lime plaster,
// weathered timber, red-ochre paint, tan rammed earth, dusty grey-brown roads and green willows.
// Each textured material keeps its painting (strokes, wear, variation) but its average colour is moved to the one
// below: the material's colour becomes target / mean(texture), per channel, in linear light. Untextured materials
// take the colour as is. Keys are glTF material names (blender/song_kit.py, street_b1.py), plus the tree card.
import * as THREE from 'three';

export const PALETTE = {
  ground: '#9c917b', // trampled loess with weeds; its road half comes out lighter (same gain)
  rammed: '#a28d70', // rammed loess wall
  earth: '#9d8e77',
  stone: '#a9a7a1',
  stone_blocks: '#908d87',
  stone_face: '#9c988f',
  paving: '#9d998f',
  brick: '#717476', // Song grey brick (qingzhuan)
  plaster: '#d9d6ce', // lime plaster
  roof: '#5c6064', // grey clay tiles
  timber: '#6d5c4b', // weathered structural timber
  deck: '#9c907f', // weathered planks
  redwood: '#7f3d2f', // red-ochre painted timber
  reed: '#a59472', // straw and reed mats
  willow_card: '#7b8f58', // fresh willow green
  grass: '#7a8a52',
  grass_dry: '#a19a76',
  water: '#6f8e8f',
  cloth_white: '#e3e1d9',
  bamboo: '#ad9064', // poles, shafts, stakes (the wood wash toned to dry bamboo)
  willow: '#8c9a6c',
};

// mean colour of a texture's image (sRGB 0-1), sampled down to 32 x 32; opaque pixels only
const means = new WeakMap();
function textureMean(tex) {
  if (tex?.userData?.mean) return tex.userData.mean; // a KTX2 copy: its webp's mean, from the manifest (tools/ktx2.mjs)
  if (tex?.isCompressedTexture) return null;
  const img = tex?.image;
  if (!img || !img.width) return null;
  if (means.has(img)) return means.get(img);
  const N = 32, cv = new OffscreenCanvas(N, N), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data;
  let r = 0, gg = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
  const m = n ? [r / n / 255, gg / n / 255, b / n / 255] : null;
  if (m) means.set(img, m);
  return m;
}

const lin = (c) => (c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4)); // sRGB -> linear
const target = new THREE.Color();

// the colour a material of glTF name `name` should be multiplied by (null: leave it alone)
export function trueColor(name, map, palette = PALETTE) {
  const hex = palette[name];
  if (!hex) return null;
  target.set(hex); // linear
  if (!map) return target.clone();
  const m = textureMean(map);
  if (!m) return null;
  return new THREE.Color().setRGB(target.r / Math.max(1e-3, lin(m[0])), target.g / Math.max(1e-3, lin(m[1])), target.b / Math.max(1e-3, lin(m[2])), THREE.LinearSRGBColorSpace);
}
