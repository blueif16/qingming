# Bench: http://127.0.0.1:5199/world.html?tier=low&adapt=0

2026-10-13T13:33:12.564Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 5107 ms · assets 33268 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 581 | 1.56 | 0.35 | 1.26 | 128 | 771k | 390×844 | – | 307 |
| phone proxy, 4x CPU | 466 | crown | 67 | 13.81 | 3.45 | 8.09 | 168 | 1132k | 390×844 | – | 332 |
| warm | 432 | grain_wharf | 506 | 1.80 | 0.37 | 1.48 | 149 | 469k | 390×844 | – | 240 |
| phone proxy, 4x CPU | 432 | grain_wharf | 46 | 20.44 | 5.05 | 12.81 | 149 | 468k | 390×844 | – | 235 |
| warm | 308 | storyteller | 946 | 0.92 | 0.16 | 0.55 | 98 | 396k | 390×844 | – | 214 |
| phone proxy, 4x CPU | 308 | storyteller | 100 | 8.84 | 1.63 | 4.89 | 99 | 402k | 390×844 | – | 215 |

No console errors or warnings.
