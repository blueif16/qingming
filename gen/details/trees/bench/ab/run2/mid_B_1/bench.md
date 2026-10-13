# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0

2026-10-13T10:25:57.652Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 4090 ms · assets 25653 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 165 | 5.44 | 1.13 | 4.67 | 220 | 1901k | 1920×1080 | – | 302 |
| mid, 1080p | 475 | crown | 198 | 4.66 | 0.96 | 3.93 | 220 | 1918k | 1920×1080 | – | 292 |
| warm | 442 | grain_wharf | 291 | 3.06 | 0.57 | 2.01 | 165 | 603k | 1920×1080 | – | 336 |
| mid, 1080p | 442 | grain_wharf | 306 | 3.00 | 0.54 | 1.95 | 165 | 604k | 1920×1080 | – | 347 |
| warm | 308 | storyteller | 459 | 1.87 | 0.30 | 1.14 | 127 | 656k | 1920×1080 | – | 421 |
| mid, 1080p | 308 | storyteller | 432 | 1.95 | 0.30 | 1.29 | 128 | 665k | 1920×1080 | – | 413 |

No console errors or warnings.
