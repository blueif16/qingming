# Bench: http://127.0.0.1:5180/gate.html

2026-10-11T23:50:10.029Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 2 s per row · load 745 ms · assets 4729 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | bridge | 350 | 2.68 | 0.56 | 2.09 | 293 | 834k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | street | 411 | 2.29 | 0.49 | 1.81 | 285 | 833k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | tower | 475 | 1.97 | 0.45 | 1.67 | 220 | 635k |
| 1 gate, 80 people | 80 | bridge | 240 | 3.98 | 1.07 | 2.86 | 400 | 1292k |
| 1 gate, 80 people | 80 | street | 255 | 3.73 | 0.99 | 2.79 | 394 | 1299k |
| 1 gate, 80 people | 80 | tower | 279 | 3.43 | 1.05 | 2.45 | 279 | 887k |
| 4 gates, 172 people (each with its own routines) | 172 | bridge | 107 | 9.08 | 3.24 | 4.87 | 372 | 1025k |
| 4 gates, 172 people (each with its own routines) | 172 | street | 82 | 11.95 | 3.31 | 8.92 | 937 | 2733k |
| 4 gates, 172 people (each with its own routines) | 172 | tower | 112 | 8.79 | 2.44 | 6.88 | 862 | 2492k |
| 4 gates, 240 people | 240 | bridge | 119 | 8.13 | 3.16 | 4.27 | 435 | 1296k |
| 4 gates, 240 people | 240 | street | 78 | 12.54 | 3.53 | 8.35 | 1095 | 3410k |
| 4 gates, 240 people | 240 | tower | 83 | 11.74 | 3.28 | 8.08 | 998 | 3074k |
| 4 gates 240 people, CPU 4x slower | 240 | tower | 18 | 53.76 | 15.21 | 27.24 | 995 | 3061k |
| 1 gate 43 people, CPU 4x slower | 43 | tower | 113 | 8.19 | 2.06 | 5.87 | 208 | 583k |

No console errors or warnings.
