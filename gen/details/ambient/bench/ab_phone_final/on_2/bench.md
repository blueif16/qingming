# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1&ambient=1

2026-10-13T13:26:31.148Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 5653 ms · assets 23513 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 330 | 2.75 | 0.58 | 1.44 | 129 | 767k | 390×844 | 93 | 396 |
| phone proxy, 4x CPU | 466 | crown | 27 | 35.43 | 10.15 | 15.66 | 129 | 769k | 390×844 | 93 | 397 |
| warm | 308 | storyteller | 421 | 2.09 | 0.31 | 1.29 | 100 | 397k | 390×844 | 71 | 297 |
| phone proxy, 4x CPU | 308 | storyteller | 55 | 16.39 | 2.76 | 10.28 | 101 | 403k | 390×844 | 71 | 291 |

No console errors or warnings.
