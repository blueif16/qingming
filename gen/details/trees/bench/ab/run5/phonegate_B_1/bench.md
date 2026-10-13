# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road&trees=3d

2026-10-13T13:16:58.943Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2990 ms · assets 25810 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | bridge | 320 | 2.88 | 0.44 | 2.24 | 186 | 1548k | 390×844 | – | 170 |
| phone proxy, 4x CPU | 371 | bridge | 24 | 40.50 | 7.81 | 20.08 | 203 | 1674k | 390×844 | – | 167 |
| warm | 371 | tower | 576 | 1.53 | 0.27 | 1.12 | 135 | 751k | 390×844 | – | 190 |
| phone proxy, 4x CPU | 371 | tower | 103 | 8.63 | 1.61 | 6.17 | 135 | 746k | 390×844 | – | 181 |

No console errors or warnings.
