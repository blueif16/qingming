# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0&trees=cards

2026-10-13T10:16:31.299Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 3065 ms · assets 22797 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 223 | 4.00 | 0.86 | 2.83 | 164 | 1209k | 1920×1080 | – | 252 |
| mid, 1080p | 475 | crown | 227 | 4.11 | 0.87 | 2.93 | 164 | 1218k | 1920×1080 | – | 255 |
| warm | 442 | grain_wharf | 322 | 2.82 | 0.53 | 1.96 | 205 | 738k | 1920×1080 | – | 255 |
| mid, 1080p | 442 | grain_wharf | 286 | 3.23 | 0.58 | 2.13 | 164 | 546k | 1920×1080 | – | 269 |
| warm | 308 | storyteller | 323 | 2.52 | 0.39 | 1.92 | 127 | 640k | 1920×1080 | – | 442 |
| mid, 1080p | 308 | storyteller | 377 | 2.33 | 0.36 | 1.69 | 127 | 645k | 1920×1080 | – | 438 |

No console errors or warnings.
