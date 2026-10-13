# Bench: http://127.0.0.1:5196/world.html?tier=low&adapt=0

2026-10-13T14:25:33.406Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2919 ms · assets 17233 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 377 | 2.43 | 0.56 | 1.58 | 127 | 767k | 390×844 | – | 251 |
| phone proxy, 4x CPU | 466 | crown | 52 | 17.93 | 4.63 | 7.12 | 127 | 769k | 390×844 | – | 259 |
| warm | 432 | grain_wharf | 510 | 1.79 | 0.36 | 1.37 | 148 | 469k | 390×844 | – | 176 |
| phone proxy, 4x CPU | 432 | grain_wharf | 83 | 11.17 | 2.60 | 6.56 | 170 | 572k | 390×844 | – | 197 |
| warm | 308 | storyteller | 689 | 1.28 | 0.21 | 0.65 | 98 | 397k | 390×844 | – | 152 |
| phone proxy, 4x CPU | 308 | storyteller | 108 | 8.22 | 1.43 | 3.14 | 99 | 403k | 390×844 | – | 146 |

No console errors or warnings.
