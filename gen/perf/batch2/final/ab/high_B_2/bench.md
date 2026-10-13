# Bench: http://127.0.0.1:5199/world.html?tier=high&adapt=0

2026-10-13T13:43:23.969Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2451 ms · assets 33055 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 388 | 2.38 | 0.48 | 2.38 | 219 | 1932k | 1920×1080 | – | 270 |
| high, 1080p | 475 | crown | 431 | 2.14 | 0.42 | 2.18 | 219 | 1950k | 1920×1080 | – | 255 |
| warm | 443 | grain_wharf | 398 | 2.33 | 0.43 | 2.31 | 210 | 784k | 1920×1080 | – | 302 |
| high, 1080p | 443 | grain_wharf | 244 | 3.82 | 0.70 | 3.01 | 211 | 786k | 1920×1080 | – | 305 |
| warm | 308 | storyteller | 668 | 1.34 | 0.20 | 1.44 | 152 | 1041k | 1920×1080 | – | 204 |
| high, 1080p | 308 | storyteller | 681 | 1.31 | 0.19 | 1.43 | 154 | 1058k | 1920×1080 | – | 198 |

No console errors or warnings.
