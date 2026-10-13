# Bench: http://127.0.0.1:5198/world.html?tier=low&adapt=0&start=0&cells=0

2026-10-13T10:51:46.465Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3386 ms · assets 30673 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 590 | 1.50 | 0.28 | 0.61 | 88 | 232k | 390×844 | – | 312 |
| warm | 466 | crown | 334 | 2.73 | 0.63 | 1.74 | 130 | 772k | 390×844 | – | 488 |
| phone proxy, 4x CPU | 466 | crown | 32 | 29.46 | 7.72 | 12.10 | 129 | 767k | 390×844 | – | 492 |
| warm | 466 | under_arch | 320 | 2.89 | 0.65 | 1.64 | 102 | 526k | 390×844 | – | 500 |
| phone proxy, 4x CPU | 466 | under_arch | 23 | 41.80 | 13.00 | 15.31 | 102 | 526k | 390×844 | – | 490 |

No console errors or warnings.
