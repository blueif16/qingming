# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&trees=cards

2026-10-13T10:03:39.843Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2573 ms · assets 22846 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 331 | 2.74 | 0.44 | 2.65 | 129 | 463k | 1920×1080 | – | 347 |
| high, 1080p | 472 | crown | 290 | 3.07 | 0.60 | 2.72 | 221 | 1949k | 1920×1080 | – | 507 |
| warm | 443 | grain_wharf | 281 | 3.22 | 0.54 | 3.21 | 212 | 781k | 1920×1080 | – | 569 |
| high, 1080p | 443 | grain_wharf | 377 | 2.40 | 0.40 | 2.15 | 213 | 785k | 1920×1080 | – | 561 |
| warm | 308 | storyteller | 322 | 2.56 | 0.38 | 2.40 | 154 | 1051k | 1920×1080 | – | 594 |
| high, 1080p | 308 | storyteller | 294 | 3.10 | 0.37 | 3.26 | 156 | 1077k | 1920×1080 | – | 572 |

No console errors or warnings.
