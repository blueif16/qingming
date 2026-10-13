# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1

2026-10-13T13:23:01.042Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3644 ms · assets 23573 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 239 | 3.88 | 0.89 | 2.79 | 128 | 771k | 390×844 | 76 | 344 |
| phone proxy, 4x CPU | 466 | crown | 20 | 47.62 | 16.24 | 14.89 | 127 | 768k | 390×844 | 76 | 370 |
| warm | 308 | storyteller | 727 | 1.19 | 0.18 | 0.57 | 96 | 392k | 390×844 | 55 | 265 |
| phone proxy, 4x CPU | 308 | storyteller | 47 | 19.62 | 3.79 | 6.35 | 100 | 407k | 390×844 | 55 | 285 |

No console errors or warnings.
