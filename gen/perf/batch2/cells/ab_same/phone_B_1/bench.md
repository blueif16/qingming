# Bench: http://127.0.0.1:5198/world.html?tier=low&adapt=0&start=0

2026-10-13T10:55:43.919Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3385 ms · assets 30027 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 541 | 1.63 | 0.27 | 0.57 | 88 | 232k | 390×844 | – | 349 |
| warm | 466 | crown | 281 | 3.26 | 0.69 | 1.75 | 120 | 715k | 390×844 | – | 530 |
| phone proxy, 4x CPU | 466 | crown | 26 | 36.99 | 9.91 | 16.53 | 120 | 715k | 390×844 | – | 552 |
| warm | 466 | under_arch | 361 | 2.54 | 0.54 | 1.62 | 92 | 460k | 390×844 | – | 545 |
| phone proxy, 4x CPU | 466 | under_arch | 24 | 40.49 | 12.02 | 15.88 | 126 | 745k | 390×844 | – | 534 |

No console errors or warnings.
