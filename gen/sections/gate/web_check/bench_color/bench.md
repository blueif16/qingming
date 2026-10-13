# Bench: http://127.0.0.1:5180/gate.html

2026-10-11T00:09:44.146Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 2 s per row · load 683 ms · assets 4954 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | bridge | 316 | 2.97 | 0.66 | 2.61 | 266 | 870k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | street | 503 | 1.84 | 0.45 | 1.75 | 268 | 905k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | tower | 622 | 1.48 | 0.36 | 1.49 | 219 | 792k |
| 1 gate, 80 people | 80 | bridge | 362 | 2.60 | 0.75 | 2.40 | 361 | 1278k |
| 1 gate, 80 people | 80 | street | 305 | 3.10 | 0.87 | 2.73 | 379 | 1379k |
| 1 gate, 80 people | 80 | tower | 323 | 2.93 | 0.89 | 2.66 | 290 | 1096k |
| 4 gates, 172 people (each with its own routines) | 172 | bridge | 205 | 4.71 | 1.77 | 2.59 | 332 | 1052k |
| 4 gates, 172 people (each with its own routines) | 172 | street | 139 | 7.01 | 2.05 | 6.31 | 855 | 2890k |
| 4 gates, 172 people (each with its own routines) | 172 | tower | 118 | 8.34 | 2.42 | 6.88 | 814 | 2811k |
| 4 gates, 240 people | 240 | bridge | 135 | 7.21 | 2.79 | 3.69 | 388 | 1292k |
| 4 gates, 240 people | 240 | street | 91 | 10.85 | 3.17 | 7.63 | 1015 | 3575k |
| 4 gates, 240 people | 240 | tower | 89 | 11.01 | 3.22 | 8.08 | 968 | 3471k |
| 4 gates 240 people, CPU 4x slower | 240 | tower | 14 | 71.15 | 18.23 | 35.51 | 965 | 3458k |
| 1 gate 43 people, CPU 4x slower | 43 | tower | 68 | 13.81 | 3.16 | 8.44 | 221 | 801k |

No console errors or warnings.
