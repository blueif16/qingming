# Bench: http://127.0.0.1:5196/world.html?start=0&tier=low&adapt=0

2026-10-13T09:59:34.090Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2874 ms · assets 31606 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1082 | 0.80 | 0.14 | 0.41 | 86 | 228k | 390×844 | – | 297 |
| phone proxy, 4x CPU | 466 | crown | 19 | 49.42 | 21.63 | 12.42 | 123 | 530k | 390×844 | – | 394 |
| warm | 432 | grain_wharf | 308 | 3.02 | 0.57 | 2.32 | 151 | 471k | 390×844 | – | 453 |
| phone proxy, 4x CPU | 432 | grain_wharf | 23 | 40.96 | 11.94 | 16.56 | 175 | 570k | 390×844 | – | 428 |
| warm | 308 | storyteller | 518 | 1.72 | 0.26 | 0.97 | 99 | 398k | 390×844 | – | 450 |
| phone proxy, 4x CPU | 308 | storyteller | 40 | 23.49 | 4.29 | 8.57 | 118 | 556k | 390×844 | – | 451 |

No console errors or warnings.
