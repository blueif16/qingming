# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road&trees=cards

2026-10-13T13:15:19.253Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2712 ms · assets 23480 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | bridge | 369 | 2.44 | 0.39 | 1.44 | 185 | 1525k | 390×844 | – | 171 |
| phone proxy, 4x CPU | 371 | bridge | 27 | 34.90 | 6.85 | 18.88 | 202 | 1656k | 390×844 | – | 154 |
| warm | 371 | tower | 391 | 2.27 | 0.42 | 1.36 | 134 | 726k | 390×844 | – | 172 |
| phone proxy, 4x CPU | 371 | tower | 39 | 23.74 | 4.96 | 12.82 | 140 | 777k | 390×844 | – | 180 |

No console errors or warnings.
