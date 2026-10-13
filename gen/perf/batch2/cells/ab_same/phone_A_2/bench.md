# Bench: http://127.0.0.1:5198/world.html?tier=low&adapt=0&start=0&cells=0

2026-10-13T11:15:48.236Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3254 ms · assets 30027 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1136 | 0.77 | 0.13 | 0.39 | 86 | 227k | 390×844 | – | 360 |
| warm | 466 | crown | 653 | 1.39 | 0.28 | 1.15 | 129 | 767k | 390×844 | – | 553 |
| phone proxy, 4x CPU | 466 | crown | 85 | 10.89 | 2.51 | 6.52 | 129 | 767k | 390×844 | – | 548 |
| warm | 466 | under_arch | 575 | 1.58 | 0.33 | 1.13 | 102 | 530k | 390×844 | – | 544 |
| phone proxy, 4x CPU | 466 | under_arch | 83 | 10.88 | 2.54 | 6.15 | 102 | 526k | 390×844 | – | 323 |

No console errors or warnings.
