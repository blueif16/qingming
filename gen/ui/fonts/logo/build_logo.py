# /// script
# requires-python = ">=3.10"
# dependencies = ["potracer>=0.0.4", "pillow>=10", "numpy>=1.26", "scipy>=1.11"]
# ///
"""清明上河圖 logo from Emperor Huizong's own 瘦金 brushwork (楷書千字文卷, 1104): crop -> clean -> trace -> lockups.

    uv run gen/ui/fonts/logo/build_logo.py [--source commons|shmuseum]     (from qingming/)

Sources and pixel boxes: gen/ui/fonts/logo/sources.md. --source commons (default) uses the public-domain Wikimedia
Commons scan (characters about 40 px tall, upsampled 8x before tracing); --source shmuseum uses the Shanghai Museum's
2025 photo (about 160 px tall; site terms restrict reuse, see CHOICE.md), and writes only under gen/ui/fonts/logo/.
Writes: logo/clean/<char>_<source>.png (the cleaned bitmaps), logo/glyphs_<source>.json (traced paths), lockups
web/public/assets/ui/logo_h.svg, logo_v.svg, logo_col.svg and their *_light.svg (paper-coloured ink for dark grounds;
commons only; --source shmuseum writes logo/logo_*_shmuseum.svg instead).
"""
import argparse, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import potrace

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
PUB = os.path.join(QM, 'web/public/assets/ui')
INK = '#1f1b18'
PAPER = '#efe4cc'

# Per character: the context crop's origin in the scan (crops/<char>_<source>_context.png) and the tight glyph box
# (both from sources.md, scan px), and the threshold on the flat-fielded brightness (lower = stricter, thinner).
# Only ink blobs that reach into the glyph box are kept, so the neighbours in the column drop out.
CHARS = {
    'commons': {
        'scale': 8,
        'qing': dict(ctx=(4070, 93), glyph=(4095, 163, 4133, 205), t=0.78),
        'ming': dict(ctx=(3000, 0), glyph=(3025, 66, 3058, 107), t=0.77),
        'shang': dict(ctx=(3761, 308), glyph=(3786, 428, 3831, 456), t=0.77, close=(3, 23), hairline=0.35),
        'he': dict(ctx=(5089, 203), glyph=(5100, 318, 5146, 358), t=0.84, close=(31, 3), close_x=(0.72, 1.0)),
        'tu': dict(ctx=(3209, 43), glyph=(3234, 113, 3265, 154), t=0.75),
    },
    'shmuseum': {
        'scale': 2,
        'qing': dict(ctx=(16506, 422), glyph=(16596, 632, 16735, 805), t=0.76),
        'ming': dict(ctx=(12584, 44), glyph=(12674, 254, 12797, 410), t=0.76),
        'shang': dict(ctx=(15384, 1243), glyph=(15474, 1643, 15640, 1750), t=0.76, close=(3, 15), bridge=(1, 31, 0.55)),
        'he': dict(ctx=(20175, 829), glyph=(20258, 1222, 20428, 1390), t=0.88),
        'tu': dict(ctx=(13352, 225), glyph=(13442, 435, 13554, 593), t=0.76),
    },
}
ORDER = ['qing', 'ming', 'shang', 'he', 'tu']
HAN = dict(qing='清', ming='明', shang='上', he='河', tu='圖')


def clean(src, name, cfg, k):
    img = np.asarray(Image.open(os.path.join(HERE, 'crops', f'{name}_{src}_context.png')).convert('RGB'))
    img = img.astype(np.float32) / 255
    gh = cfg['glyph'][3] - cfg['glyph'][1]
    bright = img.max(axis=2)            # red ruling lines (high R) vanish; ink is dark in every channel
    bg = ndi.grey_closing(bright, size=(max(5, gh // 4),) * 2)
    bg = ndi.gaussian_filter(bg, gh / 6)
    flat = np.clip(bright / np.maximum(bg, 1e-3), 0, 1.2)
    up = ndi.zoom(flat, k, order=3)
    up = ndi.gaussian_filter(up, 0.45 * k if k > 2 else 1.0)
    ink = up < cfg['t']
    if cfg.get('close'):   # rejoin a long thin stroke whose hairline faded into dashes (上's bottom, 河's 亅)
        closed = ndi.binary_closing(ink, structure=np.ones(cfg['close'], bool))
        if cfg.get('close_x'):   # only within this horizontal band of the glyph box (keeps 口 open)
            g0, g1 = (cfg['glyph'][0] - cfg['ctx'][0]) * k, (cfg['glyph'][2] - cfg['ctx'][0]) * k
            a, b = int(g0 + (g1 - g0) * cfg['close_x'][0]), int(g0 + (g1 - g0) * cfg['close_x'][1]) + 4 * k
            closed[:, :a] = ink[:, :a]
            closed[:, b:] = ink[:, b:]
        ink = closed
    if cfg.get('bridge'):  # a hairline between a stroke and its end knot (上: the bottom stroke's 頓 at the right)
        h, w, yfrac = cfg['bridge']
        g0 = (cfg['glyph'][1] - cfg['ctx'][1]) * k
        g1 = (cfg['glyph'][3] - cfg['ctx'][1]) * k
        band = int(g0 + (g1 - g0) * yfrac)
        bridged = ndi.binary_closing(ink, structure=np.ones((h, w), bool))
        bridged[:band] = ink[:band]
        ink = bridged
    # keep only blobs that reach into this character's own ink box (drops neighbours' strokes at the crop edges)
    lab, n = ndi.label(ink)
    cx, cy = cfg['ctx']
    gx0, gy0, gx1, gy1 = [(v - o) * k for v, o in zip(cfg['glyph'], (cx, cy, cx, cy))]
    keep = np.zeros(n + 1, bool)
    areas = ndi.sum(ink, lab, index=np.arange(n + 1))
    inside = np.unique(lab[max(0, gy0):gy1, max(0, gx0):gx1])
    min_area = (0.0010 if src == 'commons' else 0.0004) * (gh * k) ** 2
    for i in inside:
        if i and areas[i] >= min_area:
            keep[i] = True
    ink = keep[lab]
    # despeckle holes: fill tiny pinholes inside strokes, keep real counters (口, 日, 囗)
    holes = ndi.binary_fill_holes(ink) & ~ink
    hl, hn = ndi.label(holes)
    if hn:
        ha = ndi.sum(holes, hl, index=np.arange(hn + 1))
        ink |= (ha < 0.0003 * (gh * k) ** 2)[hl] & holes
    ink = ndi.binary_opening(ink, iterations=1)
    if cfg.get('hairline'):
        # The brush's hairline between a stroke and its end knot faded below the scan's resolution (上: the bottom
        # stroke and its 頓 at the right; the sharper museum photo shows the hairline). Redraw it: from the main
        # stroke's rightmost point to the knot's leftmost point, the knot being the rightmost blob in the lower band.
        lab, n = ndi.label(ink)
        g0 = (cfg['glyph'][1] - cfg['ctx'][1]) * k
        g1 = (cfg['glyph'][3] - cfg['ctx'][1]) * k
        band = int(g0 + (g1 - g0) * 0.5)
        sizes = ndi.sum(ink, lab, index=np.arange(n + 1)); sizes[0] = 0
        main = int(np.argmax(sizes))
        others = [i for i in range(1, n + 1) if i != main and np.any(lab[band:] == i)]
        if others:
            knot = max(others, key=lambda i: np.nonzero(lab == i)[1].mean())
            ky, kx = np.nonzero(lab == knot)
            j = np.argmin(kx); p1 = (ky[j], kx[j])
            my_, mx_ = np.nonzero(lab[band:] == main); my_ = my_ + band
            j = np.argmax(mx_); p0 = (my_[j], mx_[j])
            r = cfg['hairline'] * k
            yy, xx = np.mgrid[0:ink.shape[0], 0:ink.shape[1]]
            for t in np.linspace(0, 1, 40):
                cy_, cx_ = p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t
                rr = r * (1.0 - 0.35 * math.sin(math.pi * t))   # thinnest mid-way, like a pulled hairline
                ink |= (yy - cy_) ** 2 + (xx - cx_) ** 2 <= rr * rr
    os.makedirs(os.path.join(HERE, 'clean'), exist_ok=True)
    Image.fromarray(np.where(ink, 0, 255).astype(np.uint8)).save(os.path.join(HERE, 'clean', f'{name}_{src}.png'))
    return ink, k


def trace(ink, px_per_unit):
    """potrace the bitmap; returns an SVG path in units (y down), and the bbox."""
    bm = potrace.Bitmap(~ink)   # potracer inverts a bool bitmap: pass True = paper
    plist = bm.trace(turdsize=4, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=0.9, opticurve=True,
                     opttolerance=0.25)
    f = lambda p: (p.x / px_per_unit, p.y / px_per_unit)
    parts, xs, ys = [], [], []
    for curve in plist:
        x, y = f(curve.start_point)
        cmds = [f'M{x:.1f} {y:.1f}']
        xs.append(x); ys.append(y)
        for seg in curve.segments:
            if seg.is_corner:
                c = f(seg.c); e = f(seg.end_point)
                cmds.append(f'L{c[0]:.1f} {c[1]:.1f} {e[0]:.1f} {e[1]:.1f}')
                xs += [c[0], e[0]]; ys += [c[1], e[1]]
            else:
                c1 = f(seg.c1); c2 = f(seg.c2); e = f(seg.end_point)
                cmds.append(f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {e[0]:.1f} {e[1]:.1f}')
                xs += [e[0]]; ys += [e[1]]
        cmds.append('Z')
        parts.append(''.join(cmds))
    d = ''.join(parts).replace(' -', '-')
    return d, (min(xs), min(ys), max(xs), max(ys))


def seal_inline(x, y, size):
    """The small plain seal (seal_small.svg) nested at (x, y)."""
    s = open(os.path.join(PUB, 'seal_small.svg')).read()
    inner = s.split('>', 1)[1].rsplit('</svg>', 1)[0]
    inner = inner.replace('qm-seal-small-cut', 'qm-logo-seal-cut')
    return f'<svg x="{x:.1f}" y="{y:.1f}" width="{size:.1f}" height="{size:.1f}" viewBox="0 0 100 100">{inner}</svg>'


def svg_doc(w, h, body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{label}">'
            f'<title>{label}</title>{body}</svg>\n')


def lockups(glyphs, src):
    """glyphs: name -> (d, bbox) in units where a full-height character is about 100. Builds three lockups."""
    def place(name, x, y, s=1.0):
        d, (x0, y0, x1, y1) = glyphs[name]
        return f'<path transform="translate({x:.1f} {y:.1f}) scale({s:.3f}) translate({-x0:.1f} {-y0:.1f})" d="{d}"/>', \
            (x1 - x0) * s, (y1 - y0) * s
    label = '清明上河圖'
    # Horizontal: one row, characters at Huizong's own relative sizes, centred on a line; the seal at the end.
    body, x, gap, hmax = [], 0.0, 20.0, max(g[1][3] - g[1][1] for g in glyphs.values())
    for n in ORDER:
        d, (x0, y0, x1, y1) = glyphs[n]
        h = y1 - y0
        p, w, _ = place(n, x, (hmax - h) / 2)
        body.append(p); x += w + gap
    seal = hmax * 0.30
    sx = x - gap + 14
    h_svg = svg_doc(sx + seal, hmax, f'<g fill="{INK}">{"".join(body)}</g>' + seal_inline(sx, hmax - seal, seal), label)
    # Vertical, after the stacked 江南百景圖 logo (reference/jiangnan jn4, jn5): 清 and 明 large, one above the other
    # (明 nudged right); 上 and 河 smaller in a second column beside 明; 圖 small under them; a tiny seal by 圖.
    small = 0.58
    b = []
    p, wq, hq = place('qing', 0, 0); b.append(p)
    my = hq + 6
    p, wm, hm = place('ming', 12, my); b.append(p)
    cx = 12 + wm + 8
    sy = my + hm * 0.18
    p, ws, hs = place('shang', cx, sy, small); b.append(p)
    hy = sy + hs + 10
    p, wh, hh = place('he', cx, hy, small); b.append(p)
    ty = max(my + hm + 6, hy + hh + 10)
    tx = cx - 14
    p, wt, ht = place('tu', tx, ty, small); b.append(p)
    sz = 18
    seal = seal_inline(tx + wt + 7, ty + ht - sz, sz)
    W2 = max(wq, 12 + wm, cx + ws, cx + wh, tx + wt + 7 + sz)
    v_svg = svg_doc(W2, ty + ht, f'<g fill="{INK}">{"".join(b)}</g>{seal}', label)
    # Column: the five characters in one vertical column with the seal under them, the way Huizong titled scrolls
    # (雪江歸棹圖: 瘦金 title, the 雙龍 seal below).
    c, y, wmax = [], 0.0, max(g[1][2] - g[1][0] for g in glyphs.values())
    for n in ORDER:
        d, (x0, y0, x1, y1) = glyphs[n]
        p, w, h = place(n, (wmax - (x1 - x0)) / 2, y)
        c.append(p); y += h + 10
    sz = wmax * 0.34
    seal = seal_inline((wmax - sz) / 2, y + 4, sz)
    col_svg = svg_doc(wmax, y + 4 + sz, f'<g fill="{INK}">{"".join(c)}</g>{seal}', label)
    return h_svg, v_svg, col_svg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', default='commons', choices=list(CHARS))
    args = ap.parse_args()
    src = args.source
    cfg = CHARS[src]
    k = cfg['scale']
    glyphs, sizes = {}, {}
    # one unit scale per source so the characters keep Huizong's relative sizes: 100 units = the mean height
    hts = [cfg[n]['glyph'][3] - cfg[n]['glyph'][1] for n in ORDER]
    unit_px = (sum(hts) / len(hts)) * k / 100
    for n in ORDER:
        ink, kk = clean(src, n, cfg[n], k)
        d, bb = trace(ink, unit_px)
        glyphs[n] = (d, bb)
        sizes[n] = len(d)
    json.dump({n: {'char': HAN[n], 'd': glyphs[n][0], 'bbox': glyphs[n][1]} for n in ORDER},
              open(os.path.join(HERE, f'glyphs_{src}.json'), 'w'), ensure_ascii=False)
    h_svg, v_svg, col_svg = lockups(glyphs, src)
    if src == 'commons':
        outs = {os.path.join(PUB, 'logo_h.svg'): h_svg, os.path.join(PUB, 'logo_v.svg'): v_svg,
                os.path.join(PUB, 'logo_col.svg'): col_svg}
    else:
        outs = {os.path.join(HERE, f'logo_h_{src}.svg'): h_svg, os.path.join(HERE, f'logo_v_{src}.svg'): v_svg,
                os.path.join(HERE, f'logo_col_{src}.svg'): col_svg}
    for p in list(outs):   # light ink for dark grounds (the mount brown, night); the seal stays cinnabar
        outs[p.replace('.svg', '_light.svg')] = outs[p].replace(f'fill="{INK}"', f'fill="{PAPER}"')
    for p, s in outs.items():
        open(p, 'w').write(s)
        print(os.path.relpath(p, QM), len(s.encode()), 'bytes')
    print('path bytes per char:', sizes)


if __name__ == '__main__':
    main()
