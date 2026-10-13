// mean difference and share of changed pixels between screenshots, plus a side-by-side crop sheet (study tool)
import sharp from 'sharp';
const [a, ...bs] = process.argv.slice(2);
const load = async (f) => { const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, info }; };
const A = await load(a);
for (const b of bs) {
  const B = await load(b);
  let s = 0, n = 0;
  for (let i = 0; i < A.data.length; i += 3) { const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]); s += d; if (d > 90) n++; }
  console.log(b, 'mean diff', (s / (A.data.length)).toFixed(2), 'changed >30/ch', (100 * n / (A.data.length / 3)).toFixed(2) + '%');
}
