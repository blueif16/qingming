# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0

2026-10-13T10:35:04.061Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2554 ms · assets 25545 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 757 | 1.15 | 0.19 | 0.58 | 88 | 232k | 390×844 | – | 264 |
| phone proxy, 4x CPU | 466 | crown | 29 | 32.32 | 13.81 | 11.28 | 138 | 731k | 390×844 | – | 443 |
| warm | 432 | grain_wharf | 345 | 2.69 | 0.50 | 2.28 | 153 | 472k | 390×844 | – | 510 |
| phone proxy, 4x CPU | 432 | grain_wharf | 19 | 51.02 | 15.53 | 19.61 | 153 | 474k | 390×844 | – | 482 |
| warm | 308 | storyteller | 748 | 1.13 | 0.16 | 0.64 | 101 | 404k | 390×844 | – | 509 |
| phone proxy, 4x CPU | 308 | storyteller | 74 | 12.15 | 2.00 | 5.52 | 102 | 410k | 390×844 | – | 524 |

No console errors or warnings.
