# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&trees=3d

2026-10-13T10:57:16.823Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2651 ms · assets 26089 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 273 | 3.43 | 0.59 | 3.29 | 220 | 1961k | 1920×1080 | – | 286 |
| high, 1080p | 475 | crown | 446 | 2.07 | 0.40 | 2.10 | 220 | 1979k | 1920×1080 | – | 287 |
| warm | 443 | grain_wharf | 313 | 2.98 | 0.51 | 2.82 | 212 | 881k | 1920×1080 | – | 340 |
| high, 1080p | 443 | grain_wharf | 270 | 3.46 | 0.58 | 2.82 | 214 | 887k | 1920×1080 | – | 349 |
| warm | 308 | storyteller | 454 | 2.00 | 0.27 | 1.90 | 155 | 1079k | 1920×1080 | – | 267 |
| high, 1080p | 308 | storyteller | 715 | 1.26 | 0.16 | 1.37 | 153 | 1062k | 1920×1080 | – | 282 |

No console errors or warnings.
