# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T13:34:48.364Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2624 ms · assets 35384 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 367 | 2.52 | 0.49 | 2.10 | 314 | 1475k | 390×844 | – | 242 |
| phone proxy, 4x CPU | 466 | crown | 48 | 19.72 | 4.19 | 9.74 | 313 | 1474k | 390×844 | – | 259 |
| warm | 432 | grain_wharf | 358 | 2.60 | 0.43 | 2.23 | 166 | 469k | 390×844 | – | 286 |
| phone proxy, 4x CPU | 432 | grain_wharf | 45 | 20.90 | 3.89 | 14.39 | 166 | 468k | 390×844 | – | 301 |
| warm | 308 | storyteller | 657 | 1.36 | 0.18 | 0.93 | 98 | 396k | 390×844 | – | 178 |
| phone proxy, 4x CPU | 308 | storyteller | 88 | 10.31 | 1.45 | 6.31 | 99 | 402k | 390×844 | – | 191 |

No console errors or warnings.
