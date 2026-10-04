// Renders IndusTrack social graphics from the review page's graphic spec.
// Usage: node tools/render.js specs.json out_dir
//   specs.json = [{"id":"2026-10-05-mon","graphic":{...}}, ...]
//   -> out_dir/<id>.png (1080x1080) and, for the brand styles, out_dir/<id>-story.png (1080x1920)
// Styles: graphic.style "statement" (blue, quote marks, big left-aligned headline) or "stat" (black,
// huge number/word, orange underline, bullets). No style = the older centered ALL-CAPS layout.
// Shared spec fields: headline [lines], accent [words in orange], pill, question (comment box),
// supportLine, muted, checklist, photo (https URL; raw.githubusercontent.com/jennypaulson/marketingimages/main/library/...),
// photoFocusX/photoFocusY (0..1), overlay (0..1), footer.
// logo: true draws the real IndusTrack logo (mark + wordmark) instead of the plain wordmark; pillTop: true puts the
// statement style's pill at the top left (with the logo top right). Both are the default from 2026-10-04 (user feedback).
// The drawing code lives in tools/draw.js (the review page uses the same code). Fonts: Poppins (OFL) in tools/fonts.
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const [,, specFile, outDir] = process.argv;
const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
// Licensed stock photos live in a PRIVATE library (never public): graphic.photo = "private:stock/<file>".
// They are read from PRIVATE_MEDIA (default /home/claude/industrack-leads/media-library) and embedded,
// so only the finished post image is ever published.
const PRIVATE_MEDIA = process.env.PRIVATE_MEDIA || '/home/claude/industrack-leads/media-library';
for (const s of specs) {
  const ph = s.graphic && s.graphic.photo;
  if (ph && ph.startsWith('private:')) {
    const fp = path.join(PRIVATE_MEDIA, ph.slice(8));
    const mime = fp.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    s.graphic = Object.assign({}, s.graphic, {photo: `data:${mime};base64,` + fs.readFileSync(fp).toString('base64')});
  }
}
const DRAW = "const FONT = '\"Helvetica Neue\", Helvetica, Arial, sans-serif';\n" + fs.readFileSync(path.join(__dirname, 'draw.js'), 'utf8');
const fontCss = ['400','500','600','700','800'].map(w => {
  const f = path.join(__dirname, 'fonts', `poppins-latin-${w}-normal.woff2`);
  const src = fs.existsSync(f) ? f : path.join(__dirname, 'fonts', 'poppins-latin-600-normal.woff2');
  return `@font-face{font-family:Poppins;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(src).toString('base64')}) format('woff2');}`;
}).join('');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<style>${fontCss}</style><canvas id="c"></canvas><script>${DRAW}<\/script>`);
  await p.evaluate(async () => { await Promise.all(['400','500','700','800'].map(w => document.fonts.load(`${w} 40px Poppins`))); });
  fs.mkdirSync(outDir, {recursive: true});
  for (const s of specs) {
    const brand = s.graphic && (s.graphic.style === 'statement' || s.graphic.style === 'stat');
    for (const fmt of brand ? ['square', 'story'] : ['square']) {
      const url = await p.evaluate(async ([g, fmt]) => {
        const c = document.getElementById('c'); const im = g.photo ? await loadPhoto(g.photo) : null;
        if (g.photo && !im) throw new Error('photo did not load: ' + g.photo);
        drawGraphic(c, g, im, fmt); return c.toDataURL('image/png');
      }, [s.graphic, fmt]);
      const name = s.id + (fmt === 'story' ? '-story' : '') + '.png';
      fs.writeFileSync(path.join(outDir, name), Buffer.from(url.split(',')[1], 'base64'));
      console.log('rendered', name);
    }
  }
  await b.close();
})();
