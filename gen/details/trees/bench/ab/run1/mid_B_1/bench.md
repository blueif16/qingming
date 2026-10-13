# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0

2026-10-13T10:17:54.016Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 3724 ms · assets 25423 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 211 | 4.25 | 0.91 | 3.00 | 165 | 1228k | 1920×1080 | – | 279 |
| mid, 1080p | 475 | crown | 236 | 3.91 | 0.84 | 2.85 | 165 | 1237k | 1920×1080 | – | 283 |
| warm | 442 | grain_wharf | 195 | 4.80 | 0.87 | 3.63 | 166 | 608k | 1920×1080 | – | 326 |
| mid, 1080p | 442 | grain_wharf | 220 | 4.24 | 0.76 | 3.25 | 165 | 604k | 1920×1080 | – | 332 |
| warm | 308 | storyteller | 341 | 2.52 | 0.40 | 1.83 | 127 | 656k | 1920×1080 | – | 405 |
| mid, 1080p | 308 | storyteller | 313 | 2.87 | 0.45 | 2.00 | 128 | 669k | 1920×1080 | – | 422 |

No console errors or warnings.
