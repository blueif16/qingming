# Bench: http://127.0.0.1:5199/world.html?tier=high&adapt=0

2026-10-13T13:39:28.954Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2706 ms · assets 33028 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 269 | 3.50 | 0.69 | 3.74 | 219 | 1932k | 1920×1080 | – | 289 |
| high, 1080p | 475 | crown | 259 | 3.61 | 0.73 | 3.41 | 219 | 1950k | 1920×1080 | – | 278 |
| warm | 443 | grain_wharf | 339 | 2.73 | 0.51 | 2.53 | 210 | 784k | 1920×1080 | – | 315 |
| high, 1080p | 443 | grain_wharf | 360 | 2.58 | 0.46 | 2.48 | 211 | 786k | 1920×1080 | – | 327 |
| warm | 308 | storyteller | 617 | 1.45 | 0.24 | 1.47 | 152 | 1041k | 1920×1080 | – | 202 |
| high, 1080p | 308 | storyteller | 643 | 1.38 | 0.21 | 1.45 | 154 | 1067k | 1920×1080 | – | 209 |

No console errors or warnings.
