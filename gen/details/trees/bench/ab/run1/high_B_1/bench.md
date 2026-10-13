# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0

2026-10-13T10:05:01.543Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 3453 ms · assets 25477 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 252 | 3.61 | 0.69 | 3.14 | 222 | 1972k | 1920×1080 | – | 287 |
| high, 1080p | 475 | crown | 241 | 3.88 | 0.71 | 4.27 | 222 | 1990k | 1920×1080 | – | 293 |
| warm | 443 | grain_wharf | 369 | 2.46 | 0.41 | 2.49 | 218 | 907k | 1920×1080 | – | 332 |
| high, 1080p | 443 | grain_wharf | 315 | 2.87 | 0.48 | 2.61 | 216 | 899k | 1920×1080 | – | 331 |
| warm | 308 | storyteller | 471 | 1.66 | 0.23 | 1.83 | 155 | 1072k | 1920×1080 | – | 427 |
| high, 1080p | 308 | storyteller | 447 | 1.98 | 0.28 | 1.84 | 157 | 1090k | 1920×1080 | – | 400 |

No console errors or warnings.
