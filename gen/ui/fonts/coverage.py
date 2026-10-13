# /// script
# dependencies = ["fonttools"]
# ///
"""Check which test characters each candidate font lacks.  uv run gen/ui/fonts/coverage.py  -> coverage.md"""
import glob, os, sys, unicodedata
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.abspath(__file__))
groups = []
for line in open(os.path.join(HERE, 'test_strings.txt'), encoding='utf-8'):
    if line.startswith('#') or '\t' not in line: continue
    g, t = line.rstrip('\n').split('\t', 1)
    groups.append((g, ''.join(sorted({c for c in t if not c.isspace()}))))
allc = ''.join(sorted({c for _, t in groups for c in t}))
rows = ['| font | file | glyphs | missing (of %d) | missing chars |' % len(allc), '|---|---|---|---|---|']
for f in sorted(glob.glob(os.path.join(HERE, 'src', '*', '*.[ot]tf'))):
    ft = TTFont(f, lazy=True, fontNumber=0)
    cmap = ft.getBestCmap()
    miss = [c for c in allc if ord(c) not in cmap]
    name = ft['name'].getDebugName(4)
    rows.append('| %s | %s | %d | %d | %s |' % (name, os.path.relpath(f, HERE), ft['maxp'].numGlyphs, len(miss), ''.join(miss)))
out = '# Coverage of the traditional test set\n\nTest set: `test_strings.txt` (%d distinct characters).\n\n' % len(allc) + '\n'.join(rows) + '\n'
open(os.path.join(HERE, 'coverage.md'), 'w', encoding='utf-8').write(out)
print(out)
