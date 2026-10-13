#!/usr/bin/env python3
# A static server for a built snapshot, with web/vercel.json's headers applied as the CDN would (batch 1's pattern):
#   python3 gen/perf/batch2/serve.py <dir> <port> [vercel.json]
import http.server, json, re, sys, functools
d, port = sys.argv[1], int(sys.argv[2])
rules = []
if len(sys.argv) > 3:
    for r in json.load(open(sys.argv[3])).get('routes', []):
        if 'headers' in r: rules.append((re.compile(r['src']), r['headers']))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path.split('?')[0]
        hit = False
        for rx, hd in rules:
            if rx.search(path):
                hit = True
                for k, v in hd.items(): self.send_header(k, v)
        if not hit: self.send_header('Cache-Control', 'public, max-age=0, must-revalidate')
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=d)).serve_forever()
