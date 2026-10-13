# query grid25: python3 q.py X,D [X,D ...]  -> hits and free floors;  python3 q.py line X0,D0 X1,D1
import json, sys, math
G = json.load(open(__file__.rsplit('/', 1)[0] + '/grid25.json'))
st, x0, d1 = G['st'], G['x0'], G['d1']
def cell(X, D):
    r, c = round((d1 - D) / st), round((X - x0) / st)
    return G['rows'][r][c]
a = sys.argv[1:]
if a[0] == 'line':
    (X0, D0), (X1, D1) = [tuple(map(float, p.split(','))) for p in a[1:3]]
    n = int(math.hypot(X1 - X0, D1 - D0) / st) + 1
    for i in range(n + 1):
        X, D = X0 + (X1 - X0) * i / n, D0 + (D1 - D0) * i / n
        h, f = cell(X, D)
        print(f'{X:7.2f} {D:6.2f}  hits {h[:4]}  free {f[:4]}')
else:
    for p in a:
        X, D = map(float, p.split(','))
        print(p, cell(X, D))
