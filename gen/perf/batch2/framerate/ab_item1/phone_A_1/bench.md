# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T08:19:36.662Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3259 ms · assets 35430 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 202 | 4.65 | 0.83 | 3.07 | 146 | 766k | 390×844 | – | 274 |
| phone proxy, 4x CPU | 466 | crown | 32 | 29.69 | 6.09 | 17.54 | 313 | 1474k | 390×844 | – | 277 |
| warm | 432 | grain_wharf | 300 | 3.10 | 0.49 | 2.39 | 303 | 781k | 390×844 | – | 314 |
| phone proxy, 4x CPU | 432 | grain_wharf | 29 | 32.83 | 6.58 | 16.08 | 303 | 779k | 390×844 | – | 318 |
| warm | 308 | storyteller | 363 | 2.48 | 0.32 | 1.69 | 241 | 815k | 390×844 | – | 195 |
| phone proxy, 4x CPU | 308 | storyteller | 34 | 27.66 | 3.99 | 14.81 | 99 | 402k | 390×844 | – | 178 |

No console errors or warnings.
