# Bench: http://127.0.0.1:5180/gate.html

2026-10-10T20:03:17.913Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 2 s per row · load 460 ms · assets 4416 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | bridge | 559 | 1.65 | 0.40 | 1.58 | 264 | 761k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | street | 601 | 1.53 | 0.39 | 1.48 | 262 | 787k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | tower | 620 | 1.47 | 0.39 | 1.44 | 217 | 674k |
| 1 gate, 80 people | 80 | bridge | 257 | 3.66 | 1.13 | 2.96 | 359 | 1168k |
| 1 gate, 80 people | 80 | street | 287 | 3.30 | 0.98 | 2.80 | 375 | 1270k |
| 1 gate, 80 people | 80 | tower | 360 | 2.61 | 0.85 | 2.34 | 290 | 986k |
| 4 gates, 172 people (each with its own routines) | 172 | bridge | 235 | 4.06 | 1.66 | 2.47 | 325 | 903k |
| 4 gates, 172 people (each with its own routines) | 172 | street | 159 | 6.12 | 1.90 | 5.18 | 848 | 2540k |
| 4 gates, 172 people (each with its own routines) | 172 | tower | 174 | 5.52 | 1.79 | 5.04 | 803 | 2427k |
| 4 gates, 240 people | 240 | bridge | 178 | 5.40 | 2.30 | 2.98 | 377 | 1126k |
| 4 gates, 240 people | 240 | street | 121 | 8.04 | 2.63 | 6.23 | 1003 | 3203k |
| 4 gates, 240 people | 240 | tower | 132 | 7.38 | 2.41 | 6.26 | 955 | 3078k |
| 4 gates 240 people, CPU 4x slower | 240 | tower | 17 | 56.63 | 14.61 | 31.70 | 956 | 3082k |
| 1 gate 43 people, CPU 4x slower | 43 | tower | 79 | 11.71 | 2.77 | 7.49 | 217 | 674k |

No console errors or warnings.
