# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T08:54:01.666Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3136 ms · assets 35370 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 241 | 3.90 | 0.70 | 2.88 | 314 | 1475k | 390×844 | – | 277 |
| phone proxy, 4x CPU | 466 | crown | 15 | 62.28 | 16.40 | 31.59 | 313 | 1474k | 390×844 | – | 301 |
| warm | 432 | grain_wharf | 194 | 4.87 | 0.81 | 3.86 | 166 | 469k | 390×844 | – | 220 |
| phone proxy, 4x CPU | 432 | grain_wharf | 20 | 47.63 | 10.98 | 23.33 | 166 | 468k | 390×844 | – | 214 |
| warm | 308 | storyteller | 468 | 1.91 | 0.25 | 1.14 | 98 | 396k | 390×844 | – | 222 |
| phone proxy, 4x CPU | 308 | storyteller | 72 | 13.11 | 1.85 | 6.44 | 242 | 822k | 390×844 | – | 251 |

No console errors or warnings.
