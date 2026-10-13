# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T09:55:14.505Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2503 ms · assets 35398 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 424 | 2.17 | 0.39 | 1.86 | 146 | 766k | 390×844 | – | 260 |
| phone proxy, 4x CPU | 466 | crown | 39 | 23.95 | 4.47 | 15.61 | 146 | 768k | 390×844 | – | 249 |
| warm | 432 | grain_wharf | 349 | 2.66 | 0.41 | 2.05 | 303 | 777k | 390×844 | – | 292 |
| phone proxy, 4x CPU | 432 | grain_wharf | 25 | 39.21 | 7.88 | 19.82 | 166 | 468k | 390×844 | – | 296 |
| warm | 308 | storyteller | 541 | 1.66 | 0.22 | 1.32 | 98 | 396k | 390×844 | – | 177 |
| phone proxy, 4x CPU | 308 | storyteller | 44 | 21.58 | 3.04 | 10.41 | 242 | 822k | 390×844 | – | 182 |

No console errors or warnings.
