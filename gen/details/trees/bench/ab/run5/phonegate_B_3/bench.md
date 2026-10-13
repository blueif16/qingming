# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road&trees=3d

2026-10-13T13:23:32.897Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3464 ms · assets 25780 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | bridge | 299 | 3.10 | 0.49 | 2.11 | 186 | 1548k | 390×844 | – | 186 |
| phone proxy, 4x CPU | 371 | bridge | 34 | 27.68 | 5.02 | 14.46 | 203 | 1674k | 390×844 | – | 189 |
| warm | 371 | tower | 435 | 2.06 | 0.37 | 1.23 | 135 | 746k | 390×844 | – | 169 |
| phone proxy, 4x CPU | 371 | tower | 38 | 25.94 | 4.76 | 10.83 | 141 | 797k | 390×844 | – | 167 |

No console errors or warnings.
