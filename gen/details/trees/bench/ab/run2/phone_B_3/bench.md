# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0

2026-10-13T10:42:15.483Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2978 ms · assets 25736 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 567 | 1.54 | 0.26 | 0.70 | 86 | 235k | 390×844 | – | 285 |
| phone proxy, 4x CPU | 466 | crown | 20 | 48.14 | 20.87 | 19.41 | 100 | 383k | 390×844 | – | 317 |
| warm | 432 | grain_wharf | 300 | 3.05 | 0.57 | 1.66 | 151 | 471k | 390×844 | – | 319 |
| phone proxy, 4x CPU | 432 | grain_wharf | 20 | 48.19 | 14.43 | 22.16 | 175 | 571k | 390×844 | – | 315 |
| warm | 308 | storyteller | 396 | 2.11 | 0.32 | 1.13 | 99 | 403k | 390×844 | – | 273 |
| phone proxy, 4x CPU | 308 | storyteller | 47 | 19.32 | 3.27 | 7.50 | 100 | 409k | 390×844 | – | 280 |

No console errors or warnings.
