const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf-8');

const fixes = [
  // Setas
  ['\u00e2\u2020\u2019', '\u2192'],
  ['\u00e2\u2020\u00a9', '\u21a9'],
  ['\u00e2\u2020\u0090', '\u2190'],
  // Ponto médio
  ['\u00c2\u00b7', '\u00b7'],
  // Emojis
  ['\u00f0\u0178\u201d\u008d', '\uD83D\uDD0D'],  // 🔍 U+1F50D
  ['\u00f0\u0178\u017d\u00af', '\uD83C\uDFAF'],  // 🎯 U+1F3AF
  ['\u00f0\u0178\u201d\u2019', '\uD83D\uDD12'],  // 🔒 U+1F512
];

let total = 0;
for (const [bad, good] of fixes) {
  const n = content.split(bad).length - 1;
  if (n > 0) {
    console.log(n + 'x: ' + JSON.stringify(bad) + ' -> ' + good);
    content = content.split(bad).join(good);
    total += n;
  }
}
console.log('Total: ' + total);
fs.writeFileSync('app/page.tsx', content, 'utf-8');
console.log('Salvo.');
