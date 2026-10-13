# Bench: http://127.0.0.1:5196/world.html?tier=low&adapt=0&clipfiles=0

2026-10-13T14:20:41.934Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2927 ms · assets 33487 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 401 | 2.29 | 0.53 | 1.95 | 127 | 767k | 390×844 | – | 282 |
| phone proxy, 4x CPU | 466 | crown | 42 | 22.16 | 5.66 | 9.31 | 127 | 769k | 390×844 | – | 287 |
| warm | 432 | grain_wharf | 402 | 2.29 | 0.48 | 1.75 | 148 | 469k | 390×844 | – | 318 |
| phone proxy, 4x CPU | 432 | grain_wharf | 63 | 14.54 | 3.36 | 9.21 | 148 | 468k | 390×844 | – | 320 |
| warm | 308 | storyteller | 613 | 1.44 | 0.25 | 0.83 | 98 | 397k | 390×844 | – | 204 |
| phone proxy, 4x CPU | 308 | storyteller | 53 | 17.46 | 3.50 | 6.51 | 99 | 403k | 390×844 | – | 208 |

No console errors or warnings.
