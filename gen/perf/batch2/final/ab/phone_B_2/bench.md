# Bench: http://127.0.0.1:5199/world.html?tier=low&adapt=0

2026-10-13T13:36:26.945Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3941 ms · assets 33087 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 433 | 2.09 | 0.46 | 1.39 | 127 | 766k | 390×844 | – | 262 |
| phone proxy, 4x CPU | 466 | crown | 59 | 15.69 | 3.82 | 9.71 | 127 | 768k | 390×844 | – | 268 |
| warm | 432 | grain_wharf | 406 | 2.25 | 0.44 | 1.57 | 149 | 469k | 390×844 | – | 315 |
| phone proxy, 4x CPU | 432 | grain_wharf | 58 | 16.08 | 3.56 | 8.93 | 149 | 468k | 390×844 | – | 316 |
| warm | 308 | storyteller | 777 | 1.12 | 0.19 | 0.61 | 98 | 396k | 390×844 | – | 232 |
| phone proxy, 4x CPU | 308 | storyteller | 71 | 12.59 | 2.26 | 6.65 | 99 | 402k | 390×844 | – | 210 |

No console errors or warnings.
