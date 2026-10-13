# Bench: http://127.0.0.1:5199/world.html?tier=low&adapt=0

2026-10-13T06:41:40.018Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2048 ms · assets 35353 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 296 | 3.16 | 0.57 | 2.06 | 147 | 778k | 390×844 | – | 253 |
| phone proxy, 4x CPU | 466 | crown | 43 | 22.07 | 4.51 | 12.68 | 146 | 773k | 390×844 | – | 242 |
| warm | 432 | grain_wharf | 265 | 3.53 | 0.56 | 2.51 | 166 | 469k | 390×844 | – | 226 |
| phone proxy, 4x CPU | 432 | grain_wharf | 46 | 20.86 | 3.93 | 11.25 | 303 | 781k | 390×844 | – | 208 |
| warm | 308 | storyteller | 597 | 1.52 | 0.19 | 0.93 | 98 | 396k | 390×844 | – | 193 |
| phone proxy, 4x CPU | 308 | storyteller | 51 | 18.38 | 2.52 | 8.83 | 242 | 822k | 390×844 | – | 181 |

No console errors or warnings.
