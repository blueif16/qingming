# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1&ambient=0

2026-10-13T09:44:39.805Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 5964 ms · assets 25360 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 444 | 1.99 | 0.35 | 0.85 | 86 | 242k | 390×844 | 69 | 280 |
| phone proxy, 4x CPU | 466 | crown | 20 | 47.82 | 20.94 | 16.58 | 100 | 383k | 390×844 | 75 | 412 |
| warm | 308 | storyteller | 883 | 0.99 | 0.14 | 0.60 | 99 | 402k | 390×844 | 77 | 462 |
| phone proxy, 4x CPU | 308 | storyteller | 97 | 9.14 | 1.43 | 5.71 | 100 | 408k | 390×844 | 77 | 480 |

No console errors or warnings.
