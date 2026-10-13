# /// script
# requires-python = ">=3.10"
# dependencies = ["svgelements>=1.9"]
# ///
"""Build the cinnabar seal SVGs (白文: characters cut white into the red) from 開元小篆 glyph outlines.

    uv run gen/ui/fonts/seal/build_seal.py            # from qingming/

Glyphs: gen/ui/fonts/src/kaiyuan_seal/u<seal codepoint>.svg (Kaiyuan Small Seal, OFL 1.1, traced from the public-domain
陳昌治本 說文解字). Two characters sit in two columns read right to left. Writes web/public/assets/ui/seal.svg (worn edge
and ink texture as SVG filters), seal_small.svg (plain, for 16-32 px accents) seal_oval.svg (朱文 oval 閑章 「清朙」, red characters on bare paper,
like the scattered 閑章 in 江南百景圖) and alternates under gen/ui/fonts/seal/.
"""
import math, os, random
import svgelements as se

QM = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
GLYPHS = os.path.join(QM, 'gen/ui/fonts/src/kaiyuan_seal')
CINNABAR = '#b5321e'
# Unicode 18 Seal codepoints (kSEAL_MCJK in SealSources.txt): 上 U+3D008, 河 U+3EF60, 清 U+3F041, 明 U+3E38F (朙 U+3E38E)
SEALS = {
    'seal': ('3D008', '3EF60'),          # 上河 (right column first)
    'alt_qingming': ('3F041', '3E38E'),  # 清朙 (說文's 正篆 for 明)
}


def rdp(pts, tol):
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1e-9
    dmax, idx = -1, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x1 * y0 - y1 * x0) / n if n > 1e-9 else math.hypot(px - x0, py - y0)
        if d > dmax:
            dmax, idx = d, i
    if dmax > tol:
        return rdp(pts[:idx + 1], tol)[:-1] + rdp(pts[idx:], tol)
    return [pts[0], pts[-1]]


def glyph_rings(code):
    """Closed polylines of the glyph, in the glyph file's own coordinates."""
    svg = se.SVG.parse(os.path.join(GLYPHS, f'u{code}.svg'))
    rings = []
    for el in svg.elements():
        if not isinstance(el, se.Path):
            continue
        for sub in el.as_subpaths():
            sp = se.Path(sub)
            length = sp.length(error=1e-2)
            if length < 1:
                continue
            n = max(8, int(length / 3))
            pts = [sp.point(i / n) for i in range(n)]
            rings.append([(p.x, p.y) for p in pts])
    return rings


def place(rings, box, pad=0.0):
    xs = [x for r in rings for x, _ in r]
    ys = [y for r in rings for _, y in r]
    gx0, gx1, gy0, gy1 = min(xs), max(xs), min(ys), max(ys)
    bx0, by0, bx1, by1 = box
    sx = (bx1 - bx0 - 2 * pad) / (gx1 - gx0)
    sy = (by1 - by0 - 2 * pad) / (gy1 - gy0)
    return [[(bx0 + pad + (x - gx0) * sx, by0 + pad + (y - gy0) * sy) for x, y in r] for r in rings]


def d_of(rings, tol, nd=1):
    out = []
    for r in rings:
        pts = rdp(r + [r[0]], tol)[:-1]
        if len(pts) < 3:
            continue
        def f(v):
            t = f'{v:.{nd}f}'
            return t.rstrip('0').rstrip('.') if '.' in t else t
        out.append('M' + ' '.join(f'{f(x)} {f(y)}' for x, y in pts) + 'Z')
    return ''.join(out)


def worn_square(x0, y0, x1, y1, r, jitter, chips, seed):
    """A rounded square whose edge wanders a little and has a few chipped bites, as on an old stamped seal."""
    rnd = random.Random(seed)
    pts = []
    step = 2.2
    corners = [(x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)]
    edges = [((x0 + r, y0), (x1 - r, y0)), ((x1, y0 + r), (x1, y1 - r)), ((x1 - r, y1), (x0 + r, y1)),
             ((x0, y1 - r), (x0, y0 + r))]
    for (a, b), (cx, cy, ang) in zip(edges, corners):
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        n = max(2, int(L / step))
        nx, ny = (b[1] - a[1]) / L, -(b[0] - a[0]) / L  # outward normal (clockwise in y-down)
        wob = 0.0
        for i in range(n):
            t = i / n
            wob = 0.6 * wob + 0.4 * rnd.uniform(-jitter, jitter)
            pts.append((a[0] + (b[0] - a[0]) * t + nx * wob, a[1] + (b[1] - a[1]) * t + ny * wob))
        for k in range(4):
            th = math.radians(ang + 22.5 * k)
            rr = r + rnd.uniform(-jitter, jitter) * 0.6
            pts.append((cx + rr * math.cos(th), cy + rr * math.sin(th)))
    # chips: pull a few short runs of edge points inwards
    for _ in range(chips):
        i = rnd.randrange(len(pts))
        depth = rnd.uniform(0.8, 2.0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        for j in range(-1, 2):
            k = (i + j) % len(pts)
            px, py = pts[k]
            dx, dy = cx - px, cy - py
            dd = math.hypot(dx, dy)
            f = depth * (1.0 if j == 0 else 0.45)
            pts[k] = (px + dx / dd * f, py + dy / dd * f)
    return 'M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'


FILTER = '''<filter id="qm-seal-worn" x="-5%" y="-5%" width="110%" height="110%">
<feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="3" result="n1"/>
<feDisplacementMap in="SourceGraphic" in2="n1" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="3" seed="11" result="n2"/>
<feColorMatrix in="n2" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -24 0 0 0 16.4" result="specks"/>
<feComposite in="d" in2="specks" operator="in" result="s"/>
<feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="1" seed="5" result="n3"/>
<feColorMatrix in="n3" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .9 0 0 0 .55" result="dens"/>
<feComposite in="s" in2="dens" operator="in"/>
</filter>'''


def build(codes, worn=True):
    right, left = (glyph_rings(c) for c in codes)
    if worn:
        field = worn_square(4, 4, 96, 96, 5, 0.55, 5, 7)
        cells = [(51, 11, 88, 89), (12, 11, 49, 89)]
        g = place(right, cells[0], 1.0) + place(left, cells[1], 1.0)
        chars = d_of(g, 0.22)
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="seal">
<defs>
{FILTER}
<mask id="qm-seal-cut"><path fill="#fff" d="{field}"/><path fill="#000" stroke="#000" stroke-width="2.1" stroke-linejoin="round" d="{chars}"/></mask>
</defs>
<g filter="url(#qm-seal-worn)"><rect width="100" height="100" fill="{CINNABAR}" mask="url(#qm-seal-cut)"/></g>
</svg>
'''
    # plain small version: no filters, fatter cuts, coarser outline
    cells = [(53, 12, 87, 88), (13, 12, 47, 88)]
    g = place(right, cells[0], 1.5) + place(left, cells[1], 1.5)
    chars = d_of(g, 0.45, 0)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="seal">
<mask id="qm-seal-small-cut"><rect x="5" y="5" width="90" height="90" rx="7" fill="#fff"/><path fill="#000" stroke="#000" stroke-width="2.4" stroke-linejoin="round" d="{chars}"/></mask>
<rect width="100" height="100" fill="{CINNABAR}" mask="url(#qm-seal-small-cut)"/>
</svg>
'''


def worn_ellipse(cx, cy, rx, ry, jitter, seed):
    rnd = random.Random(seed)
    pts, wob = [], 0.0
    for i in range(72):
        th = 2 * math.pi * i / 72
        wob = 0.6 * wob + 0.4 * rnd.uniform(-jitter, jitter)
        pts.append((cx + (rx + wob) * math.cos(th), cy + (ry + wob) * math.sin(th)))
    return 'M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'


def build_oval(codes):
    """朱文 oval 閑章: red characters and a red ring on bare paper, two characters top to bottom."""
    top, bottom = (glyph_rings(c) for c in codes)
    g = place(top, (19, 13, 51, 50), 0.5) + place(bottom, (19, 51, 51, 87), 0.5)
    chars = d_of(g, 0.22)
    ring_out = worn_ellipse(35, 50, 31, 46, 0.5, 4)
    ring_in = worn_ellipse(35, 50, 27.2, 42.2, 0.4, 9)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100" role="img" aria-label="seal">
<defs>
{FILTER}
</defs>
<g filter="url(#qm-seal-worn)" fill="{CINNABAR}"><path fill-rule="evenodd" d="{ring_out}{ring_in}"/><path stroke="{CINNABAR}" stroke-width=".9" stroke-linejoin="round" d="{chars}"/></g>
</svg>
'''


def main():
    pub = os.path.join(QM, 'web/public/assets/ui')
    here = os.path.join(QM, 'gen/ui/fonts/seal')
    os.makedirs(pub, exist_ok=True)
    outs = {
        os.path.join(pub, 'seal.svg'): build(SEALS['seal'], True),
        os.path.join(pub, 'seal_small.svg'): build(SEALS['seal'], False),
        os.path.join(here, 'alt_qingming.svg'): build(SEALS['alt_qingming'], True),
        os.path.join(pub, 'seal_oval.svg'): build_oval(SEALS['alt_qingming']),
    }
    for p, s in outs.items():
        open(p, 'w').write(s)
        print(os.path.relpath(p, QM), len(s.encode()), 'bytes')


if __name__ == '__main__':
    main()
