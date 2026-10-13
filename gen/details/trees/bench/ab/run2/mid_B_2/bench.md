# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0

2026-10-13T10:28:43.569Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2701 ms · assets 25697 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 373 | 2.39 | 0.50 | 2.06 | 165 | 1228k | 1920×1080 | – | 276 |
| mid, 1080p | 475 | crown | 360 | 2.53 | 0.54 | 1.93 | 165 | 1237k | 1920×1080 | – | 271 |
| warm | 442 | grain_wharf | 304 | 3.03 | 0.55 | 2.09 | 165 | 603k | 1920×1080 | – | 278 |
| mid, 1080p | 442 | grain_wharf | 309 | 2.98 | 0.54 | 1.95 | 165 | 604k | 1920×1080 | – | 262 |
| warm | 308 | storyteller | 508 | 1.67 | 0.24 | 1.09 | 127 | 661k | 1920×1080 | – | 352 |
| mid, 1080p | 308 | storyteller | 460 | 1.89 | 0.27 | 1.14 | 128 | 660k | 1920×1080 | – | 354 |

No console errors or warnings.
