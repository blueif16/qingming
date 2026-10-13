# Bench: http://127.0.0.1:5196/world.html?tier=low&adapt=0&clipfiles=0

2026-10-13T14:23:57.628Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2883 ms · assets 33435 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 679 | 1.34 | 0.28 | 1.09 | 127 | 767k | 390×844 | – | 274 |
| phone proxy, 4x CPU | 466 | crown | 82 | 11.25 | 2.71 | 6.65 | 127 | 769k | 390×844 | – | 270 |
| warm | 432 | grain_wharf | 635 | 1.44 | 0.28 | 1.26 | 148 | 469k | 390×844 | – | 313 |
| phone proxy, 4x CPU | 432 | grain_wharf | 87 | 10.56 | 2.36 | 6.61 | 170 | 572k | 390×844 | – | 306 |
| warm | 308 | storyteller | 1073 | 0.82 | 0.14 | 0.51 | 98 | 397k | 390×844 | – | 220 |
| phone proxy, 4x CPU | 308 | storyteller | 153 | 5.76 | 1.07 | 3.09 | 99 | 403k | 390×844 | – | 220 |

No console errors or warnings.
