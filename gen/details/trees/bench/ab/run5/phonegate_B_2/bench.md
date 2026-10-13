# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road&trees=3d

2026-10-13T13:20:12.798Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 4641 ms · assets 25810 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | bridge | 447 | 2.02 | 0.30 | 1.44 | 186 | 1548k | 390×844 | – | 165 |
| phone proxy, 4x CPU | 371 | bridge | 28 | 33.29 | 5.99 | 17.74 | 203 | 1674k | 390×844 | – | 176 |
| warm | 371 | tower | 503 | 1.78 | 0.31 | 1.20 | 135 | 746k | 390×844 | – | 187 |
| phone proxy, 4x CPU | 371 | tower | 55 | 16.65 | 3.18 | 8.79 | 135 | 746k | 390×844 | – | 172 |

No console errors or warnings.
