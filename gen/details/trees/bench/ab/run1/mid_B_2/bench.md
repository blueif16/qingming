# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0

2026-10-13T10:20:43.567Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 4036 ms · assets 25470 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 245 | 3.72 | 0.81 | 2.79 | 165 | 1228k | 1920×1080 | – | 280 |
| mid, 1080p | 475 | crown | 258 | 3.55 | 0.78 | 2.80 | 220 | 1918k | 1920×1080 | – | 298 |
| warm | 442 | grain_wharf | 258 | 3.56 | 0.67 | 2.80 | 166 | 608k | 1920×1080 | – | 343 |
| mid, 1080p | 442 | grain_wharf | 237 | 3.84 | 0.72 | 2.88 | 165 | 604k | 1920×1080 | – | 337 |
| warm | 308 | storyteller | 298 | 2.82 | 0.46 | 1.99 | 127 | 656k | 1920×1080 | – | 410 |
| mid, 1080p | 308 | storyteller | 360 | 2.44 | 0.38 | 1.75 | 128 | 665k | 1920×1080 | – | 412 |

No console errors or warnings.
