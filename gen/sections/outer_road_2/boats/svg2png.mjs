// node svg2png.mjs in.svg out.png  (sharp from qingming/tools)
import { createRequire } from 'node:module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
await sharp(process.argv[2]).png().toFile(process.argv[3]);
