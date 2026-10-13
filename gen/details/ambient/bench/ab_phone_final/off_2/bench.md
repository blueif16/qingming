# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1

2026-10-13T13:25:21.337Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3006 ms · assets 23563 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 270 | 3.40 | 0.73 | 2.24 | 128 | 771k | 390×844 | 93 | 281 |
| phone proxy, 4x CPU | 466 | crown | 30 | 32.08 | 8.80 | 12.60 | 168 | 1132k | 390×844 | 93 | 292 |
| warm | 308 | storyteller | 510 | 1.71 | 0.28 | 0.83 | 98 | 396k | 390×844 | 70 | 288 |
| phone proxy, 4x CPU | 308 | storyteller | 44 | 20.72 | 3.61 | 11.64 | 99 | 402k | 390×844 | 70 | 269 |

No console errors or warnings.
