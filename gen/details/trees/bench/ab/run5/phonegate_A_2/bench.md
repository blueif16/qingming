# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road&trees=cards

2026-10-13T13:18:35.979Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2434 ms · assets 23354 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | bridge | 371 | 2.46 | 0.40 | 1.97 | 185 | 1525k | 390×844 | – | 149 |
| phone proxy, 4x CPU | 371 | bridge | 25 | 37.64 | 7.56 | 18.98 | 186 | 1529k | 390×844 | – | 154 |
| warm | 371 | tower | 582 | 1.51 | 0.27 | 0.90 | 134 | 726k | 390×844 | – | 173 |
| phone proxy, 4x CPU | 371 | tower | 40 | 23.49 | 4.93 | 11.02 | 140 | 777k | 390×844 | – | 155 |

No console errors or warnings.
