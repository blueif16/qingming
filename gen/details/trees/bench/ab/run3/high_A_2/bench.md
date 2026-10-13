# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&trees=cards

2026-10-13T10:55:58.476Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 3296 ms · assets 23461 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 449 | 2.00 | 0.33 | 1.68 | 127 | 452k | 1920×1080 | – | 267 |
| high, 1080p | 472 | crown | 241 | 3.89 | 0.78 | 3.36 | 219 | 1938k | 1920×1080 | – | 404 |
| warm | 443 | grain_wharf | 246 | 3.83 | 0.70 | 3.16 | 209 | 765k | 1920×1080 | – | 295 |
| high, 1080p | 443 | grain_wharf | 277 | 3.38 | 0.61 | 3.01 | 211 | 769k | 1920×1080 | – | 313 |
| warm | 308 | storyteller | 649 | 1.37 | 0.20 | 1.42 | 152 | 1050k | 1920×1080 | – | 352 |
| high, 1080p | 308 | storyteller | 709 | 1.26 | 0.17 | 1.38 | 154 | 1050k | 1920×1080 | – | 350 |

No console errors or warnings.
