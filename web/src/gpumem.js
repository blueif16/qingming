// What the page has allocated on the GPU, counted at the WebGL calls that allocate it: textures (texImage2D,
// texStorage2D/3D, compressedTexImage2D), buffers (bufferData) and renderbuffers (multisampled colour, depth), each
// freed again at its delete call. Bytes are the formats' sizes (block formats by their blocks); the driver's own
// padding and the canvas's back buffer are not counted. Opt-in (world.html?gpumem=1, set by the memory and budget
// tools), so ordinary runs pay nothing.
//   const mem = trackGpuMemory(renderer.getContext()); mem.report() -> { textures, buffers, renderbuffers, total } (MB)
const MB = 1 / 1048576;

export function trackGpuMemory(gl) {
  const sizes = { texture: new Map(), buffer: new Map(), renderbuffer: new Map() }; // object -> bytes (texture: per level)
  const bound = { tex: new Map(), buf: new Map(), rb: null };
  let unit = gl.TEXTURE0;
  const texKey = (target) => {
    const t = target >= gl.TEXTURE_CUBE_MAP_POSITIVE_X && target <= gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ? gl.TEXTURE_CUBE_MAP : target;
    return bound.tex.get(`${unit}:${t}`);
  };
  const ext = {
    s3tc: gl.getExtension('WEBGL_compressed_texture_s3tc'), s3tcSrgb: gl.getExtension('WEBGL_compressed_texture_s3tc_srgb'),
    bptc: gl.getExtension('EXT_texture_compression_bptc'), astc: gl.getExtension('WEBGL_compressed_texture_astc'),
    etc: gl.getExtension('WEBGL_compressed_texture_etc'), etc1: gl.getExtension('WEBGL_compressed_texture_etc1'),
    pvrtc: gl.getExtension('WEBGL_compressed_texture_pvrtc'), rgtc: gl.getExtension('EXT_texture_compression_rgtc'),
  };
  // bytes per 4x4 block of the block-compressed formats (8: BC1/ETC1/ETC2 RGB, BC4; 16: BC3/BC5/BC7/ASTC 4x4/ETC2 RGBA)
  const block = new Map();
  const put = (e, names, bytes) => { if (e) for (const n of names) if (e[n] !== undefined) block.set(e[n], bytes); };
  put(ext.s3tc, ['COMPRESSED_RGB_S3TC_DXT1_EXT', 'COMPRESSED_RGBA_S3TC_DXT1_EXT'], 8);
  put(ext.s3tc, ['COMPRESSED_RGBA_S3TC_DXT3_EXT', 'COMPRESSED_RGBA_S3TC_DXT5_EXT'], 16);
  put(ext.s3tcSrgb, ['COMPRESSED_SRGB_S3TC_DXT1_EXT', 'COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT'], 8);
  put(ext.s3tcSrgb, ['COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT', 'COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT'], 16);
  put(ext.bptc, ['COMPRESSED_RGBA_BPTC_UNORM_EXT', 'COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT', 'COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT', 'COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT'], 16);
  put(ext.astc, ['COMPRESSED_RGBA_ASTC_4x4_KHR', 'COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR'], 16);
  put(ext.etc, ['COMPRESSED_RGB8_ETC2', 'COMPRESSED_SRGB8_ETC2', 'COMPRESSED_R11_EAC', 'COMPRESSED_SIGNED_R11_EAC', 'COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2', 'COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2'], 8);
  put(ext.etc, ['COMPRESSED_RGBA8_ETC2_EAC', 'COMPRESSED_SRGB8_ALPHA8_ETC2_EAC', 'COMPRESSED_RG11_EAC', 'COMPRESSED_SIGNED_RG11_EAC'], 16);
  put(ext.etc1, ['COMPRESSED_RGB_ETC1_WEBGL'], 8);
  put(ext.rgtc, ['COMPRESSED_RED_RGTC1_EXT', 'COMPRESSED_SIGNED_RED_RGTC1_EXT'], 8);
  put(ext.rgtc, ['COMPRESSED_RED_GREEN_RGTC2_EXT', 'COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT'], 16);
  // bytes per pixel of the uncompressed internal formats three uses (unsized RGB/RGBA as their 8-bit forms; drivers
  // store RGB8 as 4 bytes)
  const bpp = new Map([
    [gl.RGBA8, 4], [gl.SRGB8_ALPHA8, 4], [gl.RGB8, 4], [gl.SRGB8, 4], [gl.RGBA, 4], [gl.RGB, 4], [gl.RGB10_A2, 4],
    [gl.R8, 1], [gl.RG8, 2], [gl.RED, 1], [gl.RG, 2], [gl.LUMINANCE, 1], [gl.ALPHA, 1], [gl.LUMINANCE_ALPHA, 2],
    [gl.R16F, 2], [gl.RG16F, 4], [gl.RGBA16F, 8], [gl.RGB16F, 8], [gl.R32F, 4], [gl.RG32F, 8], [gl.RGBA32F, 16], [gl.RGB32F, 16],
    [gl.R11F_G11F_B10F, 4], [gl.RGBA4, 2], [gl.RGB5_A1, 2], [gl.RGB565, 2], [gl.R8UI, 1], [gl.R32UI, 4], [gl.RGBA32UI, 16],
    [gl.DEPTH_COMPONENT16, 2], [gl.DEPTH_COMPONENT24, 4], [gl.DEPTH_COMPONENT32F, 4], [gl.DEPTH24_STENCIL8, 4],
    [gl.DEPTH32F_STENCIL8, 8], [gl.DEPTH_COMPONENT, 4], [gl.DEPTH_STENCIL, 4], [gl.STENCIL_INDEX8, 1],
  ]);
  const levelBytes = (fmt, w, h, d = 1) => {
    if (block.has(fmt)) return Math.ceil(w / 4) * Math.ceil(h / 4) * block.get(fmt) * d;
    return w * h * d * (bpp.get(fmt) || 4);
  };
  const info = new WeakMap(); // texture -> [w, h, internal format] of its base level, for list()
  const setLevel = (tex, key, bytes, w, h, fmt) => {
    if (!tex) return;
    let m = sizes.texture.get(tex);
    if (!m) sizes.texture.set(tex, (m = new Map()));
    m.set(key, bytes);
    if (w && (!info.has(tex) || info.get(tex)[0] < w)) info.set(tex, [w, h, fmt]);
  };
  const wrap = (name, after) => {
    const orig = gl[name];
    if (typeof orig !== 'function') return;
    gl[name] = function (...a) { const r = orig.apply(gl, a); after(a, r); return r; };
  };
  wrap('activeTexture', ([u]) => { unit = u; });
  wrap('bindTexture', ([target, tex]) => { bound.tex.set(`${unit}:${target}`, tex); });
  wrap('deleteTexture', ([tex]) => { sizes.texture.delete(tex); });
  wrap('texStorage2D', ([target, levels, fmt, w, h]) => {
    const tex = texKey(target), faces = target === gl.TEXTURE_CUBE_MAP ? 6 : 1;
    for (let l = 0; l < levels; l++) setLevel(tex, `s${l}`, faces * levelBytes(fmt, Math.max(1, w >> l), Math.max(1, h >> l)), w, h, fmt);
  });
  wrap('texStorage3D', ([target, levels, fmt, w, h, d]) => {
    const tex = texKey(target);
    for (let l = 0; l < levels; l++) setLevel(tex, `s${l}`, levelBytes(fmt, Math.max(1, w >> l), Math.max(1, h >> l), target === gl.TEXTURE_3D ? Math.max(1, d >> l) : d), w, h, fmt);
  });
  wrap('texImage2D', (a) => {
    const [target, level, fmt] = a;
    let w, h;
    if (a.length >= 8) { w = a[3]; h = a[4]; } else { const src = a[5]; w = src?.width ?? src?.naturalWidth ?? src?.videoWidth ?? src?.displayWidth; h = src?.height ?? src?.naturalHeight ?? src?.videoHeight ?? src?.displayHeight; }
    if (w && h) setLevel(texKey(target), `${target}:${level}`, levelBytes(fmt, w, h), w, h, fmt);
  });
  wrap('texImage3D', ([target, level, fmt, w, h, d]) => setLevel(texKey(target), `3:${level}`, levelBytes(fmt, w, h, d)));
  wrap('compressedTexImage2D', ([target, level, fmt, w, h]) => setLevel(texKey(target), `${target}:${level}`, levelBytes(fmt, w, h), w, h, fmt));
  wrap('bindBuffer', ([target, buf]) => { bound.buf.set(target, buf); });
  wrap('deleteBuffer', ([buf]) => { sizes.buffer.delete(buf); });
  wrap('bufferData', ([target, data, , srcOffset, length]) => {
    const buf = bound.buf.get(target);
    if (!buf) return;
    let n = typeof data === 'number' ? data : length ? length * (data.BYTES_PER_ELEMENT || 1) : data ? data.byteLength - (srcOffset || 0) * (data.BYTES_PER_ELEMENT || 1) : 0;
    sizes.buffer.set(buf, n);
  });
  wrap('bindRenderbuffer', ([, rb]) => { bound.rb = rb; });
  wrap('deleteRenderbuffer', ([rb]) => { sizes.renderbuffer.delete(rb); });
  wrap('renderbufferStorage', ([, fmt, w, h]) => { if (bound.rb) sizes.renderbuffer.set(bound.rb, levelBytes(fmt, w, h)); });
  wrap('renderbufferStorageMultisample', ([, samples, fmt, w, h]) => { if (bound.rb) sizes.renderbuffer.set(bound.rb, Math.max(1, samples) * levelBytes(fmt, w, h)); });

  const sum = (m, f = (v) => v) => { let s = 0; for (const v of m.values()) s += f(v); return s; };
  return {
    report() {
      const textures = sum(sizes.texture, (lv) => sum(lv)) * MB, buffers = sum(sizes.buffer) * MB, renderbuffers = sum(sizes.renderbuffer) * MB;
      return {
        textures: +textures.toFixed(2), buffers: +buffers.toFixed(2), renderbuffers: +renderbuffers.toFixed(2),
        total: +(textures + buffers + renderbuffers).toFixed(2),
        counts: { textures: sizes.texture.size, buffers: sizes.buffer.size, renderbuffers: sizes.renderbuffer.size },
      };
    },
    // every live texture as [w, h, internal format (hex), MB], biggest first
    textures() {
      return [...sizes.texture].map(([t, lv]) => { const [w, h, f] = info.get(t) || [0, 0, 0]; return [w, h, '0x' + (f || 0).toString(16), +(sum(lv) * MB).toFixed(2)]; }).sort((a, b) => b[3] - a[3]);
    },
  };
}
