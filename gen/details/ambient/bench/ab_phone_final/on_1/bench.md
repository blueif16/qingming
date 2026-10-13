# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1&ambient=1

2026-10-13T13:24:11.871Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 4367 ms · assets 23563 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 241 | 3.86 | 0.80 | 2.20 | 129 | 767k | 390×844 | 93 | 345 |
| phone proxy, 4x CPU | 466 | crown | 26 | 36.57 | 9.41 | 19.41 | 129 | 769k | 390×844 | 93 | 350 |
| warm | 308 | storyteller | 428 | 2.07 | 0.33 | 1.05 | 118 | 548k | 390×844 | 71 | 238 |
| phone proxy, 4x CPU | 308 | storyteller | 50 | 18.26 | 3.15 | 9.42 | 101 | 403k | 390×844 | 71 | 226 |

No console errors or warnings.
