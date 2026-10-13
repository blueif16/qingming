# Bench: http://127.0.0.1:5196/world.html?tier=low&adapt=0

2026-10-13T08:56:19.503Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2525 ms · assets 35409 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 302 | 3.07 | 0.61 | 2.14 | 128 | 771k | 390×844 | – | 259 |
| phone proxy, 4x CPU | 466 | crown | 21 | 45.13 | 11.02 | 20.72 | 127 | 768k | 390×844 | – | 258 |
| warm | 432 | grain_wharf | 203 | 4.66 | 0.76 | 4.48 | 150 | 469k | 390×844 | – | 322 |
| phone proxy, 4x CPU | 432 | grain_wharf | 15 | 63.65 | 16.43 | 27.52 | 275 | 779k | 390×844 | – | 322 |
| warm | 308 | storyteller | 438 | 2.06 | 0.27 | 1.46 | 98 | 396k | 390×844 | – | 198 |
| phone proxy, 4x CPU | 308 | storyteller | 55 | 16.67 | 2.19 | 9.13 | 99 | 402k | 390×844 | – | 205 |

No console errors or warnings.
