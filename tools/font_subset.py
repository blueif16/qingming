# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools>=4.50", "brotli>=1.1"]
# ///
"""Subset the UI typefaces to the glyphs the product uses, as woff2 (ink UI round, gen/ui/fonts/README.md).

    uv run tools/font_subset.py                 # from qingming/; reads gen/ui/fonts/roles.json
    uv run tools/font_subset.py --check         # report only, write nothing
    uv run tools/font_subset.py --config other.json

Per role (display, text, seal, ...) the config names a source font, a CSS family and where its characters come
from: globs of JSON/JS/HTML files (a JSON glob may end in "#key1,key2" to read only the strings under those keys,
at any depth), literal "extra" text, and the global "always" punctuation. JS/HTML/TXT files give every non-ASCII
character they contain. A role with "core" text is split in two files: <role>-core.woff2 (only the core characters,
for the loading screen) and <role>.woff2 (the rest); fonts.css gives each a unicode-range, so a browser downloads
the second file only when a page shows one of its characters. "size_adjust" (e.g. "118%") becomes the CSS size-adjust
descriptor, for a face whose glyphs sit small in the em box.

Lazy subsets (ink UI round 2: long texts must not grow the first load): a role's "lazy" maps a suffix to its own
sources, e.g. "lazy": {"settings": ["web/src/ui/settings_words.js"]}. The characters they use that the role's main set
(sources + extra + core) lacks go to <role>-<suffix>.woff2, with its own @font-face and unicode-range, so the browser
fetches it only when a page shows one of those characters (the settings screen, a long description). The ranges never
overlap: a character goes to the main set, else to the first lazy group that needs it. A source starting with "!" is
excluded from the role's main sources (e.g. "!web/src/ui/settings_words.js" next to "web/src/ui/**/*.js").

Writes, under the config's out_dir: <role>[-core].woff2, fonts.css (@font-face rules), fonts.json (manifest), and
gen/ui/fonts/subset_report.md (glyph counts, KB, characters a font lacks). Re-runnable; stale role files are removed.
"""
import argparse, glob, hashlib, io, json, os, re, sys, time

from fontTools import subset
from fontTools.ttLib import TTFont

QM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK_LIKE = re.compile(r'[^\x00-\x7f]')
# Layout features worth keeping: vertical forms for vertical banners, proportional/half-width punctuation, kerning.
FEATURES = ['ccmp', 'locl', 'kern', 'vkrn', 'vert', 'vrt2', 'palt', 'vpal', 'halt', 'vhal', 'liga', 'calt', 'mark', 'mkmk']


def rel(p):
    return os.path.relpath(p, QM)


def strings_under(obj, keys):
    """All string values in a JSON tree whose (nearest) key is in keys; None keys = every string."""
    out = []
    def walk(o, k):
        if isinstance(o, dict):
            for kk, v in o.items():
                walk(v, kk)
        elif isinstance(o, list):
            for v in o:
                walk(v, k)
        elif isinstance(o, str) and (keys is None or k in keys):
            out.append(o)
    walk(obj, None)
    return out


def chars_from_source(spec, log, exclude=frozenset()):
    """spec: 'glob' or 'glob#k1,k2' (JSON only). Returns (set of chars, list of files). Files in exclude are skipped."""
    pattern, _, keys = spec.partition('#')
    keys = set(k.strip() for k in keys.split(',') if k.strip()) or None
    files = sorted(set(glob.glob(os.path.join(QM, pattern), recursive=True)) - set(exclude))
    chars = set()
    for f in files:
        text = open(f, encoding='utf-8').read()
        if f.endswith('.json'):
            try:
                data = json.loads(text)
            except json.JSONDecodeError as e:
                log.append(f'WARN {rel(f)}: bad JSON ({e}); read as text')
                chars |= set(CJK_LIKE.findall(text))
                continue
            for s in strings_under(data, keys):
                chars |= set(CJK_LIKE.findall(s))
        else:
            if keys:
                log.append(f'WARN {spec}: "#keys" only applies to JSON; {rel(f)} read whole')
            chars |= set(CJK_LIKE.findall(text))
    return chars, files


def unicode_range(codepoints):
    cps = sorted(codepoints)
    parts, i = [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        parts.append('U+%X' % cps[i] if i == j else 'U+%X-%X' % (cps[i], cps[j]))
        i = j + 1
    return ', '.join(parts)


def subset_font(src, codepoints, family, out_path):
    font = TTFont(src, recalcBBoxes=False, recalcTimestamp=False)
    opts = subset.Options()
    opts.layout_features = FEATURES
    opts.hinting = False                # CJK hints are large and modern rasterisers ignore them
    opts.desubroutinize = True          # smaller after brotli for CFF fonts
    opts.name_IDs = [0, 13, 14]         # keep copyright and licence; names are rewritten below
    opts.name_languages = ['*']
    opts.notdef_outline = True
    opts.glyph_names = False
    opts.legacy_kern = True
    opts.drop_tables += ['DSIG', 'STAT', 'meta', 'BASE', 'JSTF']
    opts.flavor = 'woff2'
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=sorted(codepoints))
    sub.subset(font)
    # Rename: our subsets are Modified Versions (OFL Reserved Font Names; IPA licence art. 3) and must not carry
    # the original family name. Copyright (0) and licence (13, 14) stay as they were.
    name = font['name']
    psname = re.sub(r'[^A-Za-z0-9-]', '', family.replace(' ', '-'))
    for nid, val in ((1, family), (2, 'Regular'), (3, f'{psname};qingming-subset'), (4, family), (6, psname),
                     (16, family), (17, 'Regular')):
        name.removeNames(nameID=nid)
        name.setName(val, nid, 3, 1, 0x409)
    for nid in (5,):
        name.removeNames(nameID=nid)
    name.setName('Subset for qingming ' + time.strftime('%Y-%m-%d'), 5, 3, 1, 0x409)
    if 'CFF ' in font:  # CFF keeps its own font name
        cff = font['CFF '].cff
        cff.fontNames = [psname]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    buf = io.BytesIO()
    font.flavor = 'woff2'
    font.save(buf)
    data = buf.getvalue()
    open(out_path, 'wb').write(data)
    return len(font.getGlyphOrder()), len(data)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--config', default=os.path.join(QM, 'gen/ui/fonts/roles.json'))
    ap.add_argument('--check', action='store_true', help='count and report only; write nothing')
    ap.add_argument('--role', action='append', help='only these roles (default: all)')
    ap.add_argument('--report', default=os.path.join(QM, 'gen/ui/fonts/subset_report.md'), help='where to write the report')
    args = ap.parse_args()
    cfg = json.load(open(args.config, encoding='utf-8'))
    out_dir = os.path.join(QM, cfg['out_dir'])
    always = set(c for c in cfg.get('always', '') if not c.isspace())
    log, rows, manifest, css = [], [], {'generated': time.strftime('%Y-%m-%dT%H:%M:%S'), 'roles': {}}, []
    css.append('/* Generated by tools/font_subset.py from gen/ui/fonts/roles.json. Do not edit; re-run the tool. */')
    total_bytes = core_bytes = lazy_bytes = 0
    for role, rc in cfg['roles'].items():
        if args.role and role not in args.role:
            continue
        src = os.path.join(QM, rc['font'])
        font = TTFont(src, lazy=True)
        cmap = font.getBestCmap()
        want, files = (set() if rc.get('no_always') else set(always)), []
        excluded = set()
        for spec in rc.get('sources', []):
            if spec.startswith('!'):
                excluded |= set(glob.glob(os.path.join(QM, spec[1:]), recursive=True))
        for spec in rc.get('sources', []):
            if spec.startswith('!'):
                continue
            ch, fs = chars_from_source(spec, log, excluded)
            want |= ch
            files += fs
            if not fs:
                log.append(f'note {role}: no files match {spec}')
        want |= set(c for c in rc.get('extra', '') if not c.isspace())
        if rc.get('latin'):
            want |= set(chr(c) for c in range(0x20, 0x7f))
        want.discard('\n')
        core = set(c for c in rc.get('core', '') if not c.isspace())
        if core and not rc.get('no_always'):
            core |= always
        if rc.get('core') and rc.get('latin'):
            core |= set(chr(c) for c in range(0x20, 0x7f))
        want |= core
        have = {c for c in want if ord(c) in cmap}
        missing = ''.join(sorted(c for c in want - have if not c.isspace()))
        if missing:
            log.append(f'MISSING in {role} ({os.path.basename(src)}): {missing}  -> these fall back to the CSS stack')
        parts = []
        if core:
            core_have = {c for c in core if ord(c) in cmap}
            rest = have - core_have
            parts.append((f'{role}-core', core_have))
            if rest:
                parts.append((role, rest))
        else:
            parts.append((role, have))
        # lazy groups: what their sources need beyond the main set, each in its own file
        taken = set(have)
        for suffix, specs in (rc.get('lazy') or {}).items():
            lz = set()
            for spec in specs:
                ch, fs = chars_from_source(spec, log)
                lz |= ch
                if not fs:
                    log.append(f'note {role}-{suffix}: no files match {spec}')
            lz.discard('\n')
            lz = {c for c in lz if not c.isspace()}
            miss = ''.join(sorted(c for c in lz if ord(c) not in cmap))
            if miss:
                log.append(f'MISSING in {role}-{suffix} ({os.path.basename(src)}): {miss}  -> these fall back to the CSS stack')
                missing += miss
            mine = {c for c in lz if ord(c) in cmap} - taken
            if mine:
                parts.append((f'{role}-{suffix}', mine))
                taken |= mine
        manifest['roles'][role] = {'family': rc['family'], 'font': rc['font'], 'licence': rc.get('licence', ''),
                                   'chars': len(have), 'missing': missing, 'files': []}
        for stem, chars in parts:
            out = os.path.join(out_dir, stem + '.woff2')
            cps = {ord(c) for c in chars}
            if args.check:
                nglyph, nbytes = len(chars), 0
            else:
                nglyph, nbytes = subset_font(src, cps, rc['family'], out)
            digest = hashlib.sha1(open(out, 'rb').read()).hexdigest()[:8] if not args.check else 'check'
            total_bytes += nbytes
            if stem.endswith('-core'):
                core_bytes += nbytes
            if stem != role and not stem.endswith('-core'):
                lazy_bytes += nbytes
            rows.append((role, stem + '.woff2', len(chars), nglyph, nbytes))
            manifest['roles'][role]['files'].append({'file': stem + '.woff2', 'chars': len(chars), 'bytes': nbytes})
            adjust = f"  size-adjust: {rc['size_adjust']};\n" if rc.get('size_adjust') else ''
            css.append('@font-face {\n  font-family: "%s";\n  src: url("%s.woff2?v=%s") format("woff2");\n'
                       '  font-weight: %s;\n  font-style: normal;\n  font-display: %s;\n%s  unicode-range: %s;\n}'
                       % (rc['family'], stem, digest, rc.get('weight', '400'), rc.get('display', 'swap'), adjust,
                          unicode_range(cps)))
        manifest['roles'][role]['stack'] = rc.get('stack', '')
        if rc.get('licence_file') and not args.check:
            # OFL / IPA: every copy of the (modified) font travels with its copyright notice and licence text
            lic = os.path.join(out_dir, f'{role}.LICENSE.txt')
            os.makedirs(out_dir, exist_ok=True)
            with open(lic, 'w', encoding='utf-8') as fh:
                fh.write(f'{rc["family"]} ({role}.woff2, {role}-core.woff2) is a subset of {os.path.basename(src)}, '
                         f'renamed and converted to WOFF2 by tools/font_subset.py for the qingming web world.\n\n')
                for lf in rc['licence_file'] if isinstance(rc['licence_file'], list) else [rc['licence_file']]:
                    fh.write(open(os.path.join(QM, lf), encoding='utf-8-sig').read().rstrip() + '\n\n')
            manifest['roles'][role]['licence_file'] = os.path.basename(lic)
    # report
    lines = ['# Font subset report', '', f'Generated {manifest["generated"]} by `tools/font_subset.py` from '
             f'`{rel(args.config)}`.', '', '| role | file | chars | glyphs | KB |', '|---|---|---|---|---|']
    for r in rows:
        lines.append('| %s | %s | %d | %d | %.1f |' % (r[0], r[1], r[2], r[3], r[4] / 1024))
    lines += ['', f'Total {total_bytes / 1024:.1f} KB; without the lazy subsets {(total_bytes - lazy_bytes) / 1024:.1f} KB (budget 250 KB); '
              f'lazy subsets (fetched only when their text shows) {lazy_bytes / 1024:.1f} KB; loading-screen core files '
              f'{core_bytes / 1024:.1f} KB (budget 60 KB).', '']
    lines += ['## Notes', ''] + [f'- {l}' for l in log] if log else []
    report = '\n'.join(lines) + '\n'
    print(report)
    if not args.check:
        os.makedirs(out_dir, exist_ok=True)
        keep = {r[1] for r in rows}
        for f in glob.glob(os.path.join(out_dir, '*.woff2')):
            stem = os.path.basename(f)
            role_of = stem[:-6].split('-')[0]  # display.woff2, text-core.woff2, text-settings.woff2 -> display, text
            if role_of in cfg['roles'] and stem not in keep and (not args.role or role_of in args.role):
                os.remove(f)
                print('removed stale', rel(f))
        if not args.role:
            open(os.path.join(out_dir, 'fonts.css'), 'w', encoding='utf-8').write('\n'.join(css) + '\n')
            json.dump(manifest, open(os.path.join(out_dir, 'fonts.json'), 'w', encoding='utf-8'), ensure_ascii=False,
                      indent=1)
            open(args.report, 'w', encoding='utf-8').write(report)
        else:
            print('(--role: fonts.css, fonts.json and the report were not rewritten; run without --role for those)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
