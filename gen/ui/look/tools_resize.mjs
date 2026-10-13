// downsize the jiangnan refs for reading (study-only copies under gen/ui/look/ref_small/)
import { createRequire } from 'module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
import fs from 'fs';
const src = 'reference/jiangnan', out = 'gen/ui/look/ref_small';
for (const f of fs.readdirSync(src).filter(f => f.endsWith('.png'))) {
  const m = await sharp(`${src}/${f}`).metadata();
  console.log(f, m.width, m.height, m.channels);
  for (const s of [1600, 1000]) {
    await sharp(`${src}/${f}`).resize({ width: m.width >= m.height ? s : null, height: m.height > m.width ? s : null })
      .jpeg({ quality: 90 }).toFile(`${out}/${f.replace('.png', `_${s}.jpg`)}`);
  }
}
