# Bench: http://127.0.0.1:5198/world.html?tier=low&adapt=0&start=0

2026-10-13T11:19:29.954Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3112 ms · assets 30615 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1029 | 0.85 | 0.13 | 0.43 | 88 | 236k | 390×844 | – | 369 |
| warm | 466 | crown | 622 | 1.44 | 0.28 | 1.16 | 120 | 715k | 390×844 | – | 433 |
| phone proxy, 4x CPU | 466 | crown | 82 | 11.17 | 2.31 | 7.49 | 121 | 721k | 390×844 | – | 443 |
| warm | 466 | under_arch | 622 | 1.46 | 0.29 | 1.02 | 92 | 464k | 390×844 | – | 428 |
| phone proxy, 4x CPU | 466 | under_arch | 96 | 9.57 | 2.14 | 5.61 | 126 | 745k | 390×844 | – | 435 |

No console errors or warnings.
