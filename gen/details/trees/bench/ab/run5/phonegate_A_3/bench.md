# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road&trees=cards

2026-10-13T13:21:51.304Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2996 ms · assets 23492 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | bridge | 289 | 3.18 | 0.51 | 2.21 | 185 | 1525k | 390×844 | – | 156 |
| phone proxy, 4x CPU | 371 | bridge | 28 | 33.82 | 6.81 | 18.68 | 186 | 1529k | 390×844 | – | 163 |
| warm | 371 | tower | 352 | 2.56 | 0.47 | 1.54 | 134 | 726k | 390×844 | – | 162 |
| phone proxy, 4x CPU | 371 | tower | 34 | 27.69 | 5.82 | 12.58 | 134 | 726k | 390×844 | – | 160 |

No console errors or warnings.
