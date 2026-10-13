# Bench: http://127.0.0.1:5180/gate.html

2026-10-10T21:14:00.566Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 2 s per row · load 634 ms · assets 4880 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | bridge | 340 | 2.71 | 0.60 | 2.36 | 267 | 878k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | street | 348 | 2.66 | 0.64 | 2.18 | 267 | 904k |
| gate with its people (16 figures, porter, 26 traffic = 43) | 43 | tower | 386 | 2.38 | 0.60 | 2.11 | 218 | 791k |
| 1 gate, 80 people | 80 | bridge | 184 | 5.18 | 1.42 | 3.56 | 360 | 1276k |
| 1 gate, 80 people | 80 | street | 192 | 4.94 | 1.36 | 3.72 | 380 | 1387k |
| 1 gate, 80 people | 80 | tower | 223 | 4.24 | 1.26 | 3.15 | 295 | 1121k |
| 4 gates, 172 people (each with its own routines) | 172 | bridge | 117 | 8.29 | 2.78 | 4.23 | 328 | 1058k |
| 4 gates, 172 people (each with its own routines) | 172 | street | 83 | 11.77 | 3.08 | 9.84 | 859 | 2930k |
| 4 gates, 172 people (each with its own routines) | 172 | tower | 91 | 10.77 | 2.91 | 8.29 | 812 | 2826k |
| 4 gates, 240 people | 240 | bridge | 83 | 11.83 | 4.32 | 5.98 | 380 | 1281k |
| 4 gates, 240 people | 240 | street | 64 | 15.26 | 4.09 | 10.91 | 1010 | 3577k |
| 4 gates, 240 people | 240 | tower | 64 | 15.34 | 3.99 | 10.82 | 963 | 3473k |
| 4 gates 240 people, CPU 4x slower | 240 | tower | 10 | 138.33 | 32.19 | 73.21 | 959 | 3455k |
| 1 gate 43 people, CPU 4x slower | 43 | tower | 35 | 26.96 | 5.20 | 17.12 | 212 | 765k |

No console errors or warnings.
