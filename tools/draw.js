/* ---------- graphic renderer (1080x1080) v2: accent words + photo layout ---------- */
const PHOTOS = {};
function loadPhoto(url){
  if (!PHOTOS[url]) PHOTOS[url] = new Promise(res=>{ const im = new Image(); im.crossOrigin = "anonymous"; im.onload = ()=>res(im); im.onerror = ()=>res(null); im.src = url; });
  return PHOTOS[url];
}
function fitSize(ctx, lines, weight, max, maxW){ let s = max; while (s > 20){ ctx.font = `${weight} ${s}px ${FONT}`; if (lines.every(l => ctx.measureText(l).width <= maxW)) break; s -= 2; } return s; }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function drawClassic(canvas, g, photoImg){
  const W = 1080, ctx = canvas.getContext("2d");
  canvas.width = W; canvas.height = W;
  const bg = g.bg || "#0540a5";
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,W);
  let photo = photoImg || null;
  if (g.photo && !photo){
    loadPhoto(g.photo).then(im=>{ if (im && canvas.isConnected !== false) drawClassic(canvas, g, im); });
  }
  if (photo){
    const s = Math.max(W/photo.width, W/photo.height), pw = photo.width*s, ph = photo.height*s;
    const fx = g.photoFocusX ?? 0.5, fy = g.photoFocusY ?? 0.4;
    ctx.drawImage(photo, (W-pw)*fx, (W-ph)*fy, pw, ph);
    const dark = g.overlay ?? 0.55, gr = ctx.createLinearGradient(0,0,0,W);
    gr.addColorStop(0, `rgba(0,0,0,${Math.max(0,dark-0.35)})`); gr.addColorStop(0.45, `rgba(0,0,0,${dark-0.1})`); gr.addColorStop(1, `rgba(0,0,0,${Math.min(0.92,dark+0.3)})`);
    ctx.fillStyle = gr; ctx.fillRect(0,0,W,W);
  } else if (bg.toLowerCase() === "#0540a5"){ const gr = ctx.createLinearGradient(0,0,W,W); gr.addColorStop(0,"rgba(255,255,255,0.05)"); gr.addColorStop(1,"rgba(0,0,0,0.12)"); ctx.fillStyle = gr; ctx.fillRect(0,0,W,W); }
  const maxW = 900, blocks = [];
  const accent = new Set((g.accent||[]).map(w=>String(w).toUpperCase().replace(/[^A-Z0-9+]/g,"")));
  const isAcc = t => accent.has(t.toUpperCase().replace(/[^A-Z0-9+]/g,""));
  const drawLine = (l, y, color, acc) => {
    if (!acc || !accent.size){ ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(l, W/2, y); return; }
    const parts = l.split(/(\s+)/), w = ctx.measureText(l).width; let x = (W-w)/2; ctx.textAlign = "left";
    parts.forEach(p=>{ ctx.fillStyle = (p.trim() && isAcc(p)) ? "#ff6600" : color; ctx.fillText(p, x, y); x += ctx.measureText(p).width; });
  };
  if (g.pill){ ctx.font = `700 30px ${FONT}`; const tw = ctx.measureText(g.pill).width; blocks.push({h:70, gap:56, draw:y=>{ const pw = tw + 60, x = (W-pw)/2; ctx.fillStyle = "#ff6600"; roundRect(ctx,x,y,pw,70,35); ctx.fill(); ctx.fillStyle="#fff"; ctx.font=`700 30px ${FONT}`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(g.pill, W/2, y+36); }}); }
  const textBlock = (lines, weight, max, gap, color="#fff", acc=false) => { const s = fitSize(ctx, lines, weight, max, maxW), lh = Math.round(s*1.12); blocks.push({h: lh*lines.length, gap, draw:y=>{ ctx.font=`${weight} ${s}px ${FONT}`; ctx.textBaseline="top"; lines.forEach((l,i)=>drawLine(l, y+i*lh, color, acc)); }}); };
  if (g.headline) textBlock(g.headline, 700, g.headlineMax || 96, g.divider ? 40 : 48, "#fff", true);
  if (g.divider) blocks.push({h:4, gap:40, draw:y=>{ ctx.fillStyle="#0092cb"; ctx.fillRect(W/2-60,y,120,4); }});
  if (g.headline2) textBlock(g.headline2, 700, g.headline2Max || 58, 48, "#fff", true);
  if (g.checklist){ ctx.font = `400 42px ${FONT}`; const items = g.checklist.map(t=>"✓  "+t); const bw = Math.max(...items.map(t=>ctx.measureText(t).width)), lh = 62; blocks.push({h: lh*items.length, gap:52, draw:y=>{ ctx.fillStyle="#fff"; ctx.font=`400 42px ${FONT}`; ctx.textAlign="left"; ctx.textBaseline="top"; items.forEach((t,i)=>ctx.fillText(t,(W-bw)/2,y+i*lh)); }}); }
  if (g.supportLine) textBlock([g.supportLine], 400, 36, 52);
  if (g.cta) textBlock([g.cta], 700, 40, 26);
  if (g.footer){ const fs = g.footerSize || 32; blocks.push({h:fs+4, gap:0, draw:y=>{ ctx.fillStyle = g.footerColor || "rgba(255,255,255,0.85)"; ctx.font=`${fs>32?700:400} ${fs}px ${FONT}`; ctx.textAlign="center"; ctx.textBaseline="top"; ctx.fillText(g.footer, W/2, y); }}); }
  if (!blocks.length) return;
  blocks[blocks.length-1].gap = 0;
  const total = blocks.reduce((a,b)=>a+b.h+b.gap,0);
  let y = (photo) ? Math.max(70, W - 80 - total) : Math.max(70, (W-total)/2);
  blocks.forEach(b=>{ b.draw(y); y += b.h + b.gap; });
}
/* ---------- v3 brand styles ("statement", "stat"), square 1080x1080 or story 1080x1920 ---------- */
const BFONT = 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif';
function brandFontsReady(){ try { return document.fonts.check(`800 40px Poppins`) && document.fonts.check(`400 40px Poppins`); } catch(e){ return true; } }
function wrapWords(ctx, text, maxW){ const words = String(text).split(/\s+/).filter(Boolean), out = []; let cur = "";
  words.forEach(w=>{ const t = cur ? cur+" "+w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } }); if (cur) out.push(cur); return out; }
function fitWrapped(ctx, items, weight, max, min, maxW, maxLines){ let s = max, lines = [];
  for (; s >= min; s -= 2){ ctx.font = `${weight} ${s}px ${BFONT}`; lines = items.flatMap(t=>wrapWords(ctx, t, maxW)); if (lines.length <= maxLines && lines.every(l=>ctx.measureText(l).width <= maxW)) break; }
  return {s: Math.max(s,min), lines}; }
function texture(ctx, W, H, alpha){ ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = -H; x < W; x += 30){ ctx.moveTo(x,0); ctx.lineTo(x+H,H); } ctx.stroke(); ctx.restore(); }
function pillAt(ctx, text, x, y, h, fs, align){ ctx.font = `700 ${fs}px ${BFONT}`; const w = ctx.measureText(text).width + fs*1.6; const px = align==="right" ? x - w : x;
  ctx.fillStyle = "#ff6600"; roundRect(ctx, px, y, w, h, h/2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, px + w/2, y + h/2 + 1); return w; }
function accentWords(g){ return new Set((g.accent||[]).map(w=>String(w).toUpperCase().replace(/[^A-Z0-9+$]/g,""))); }
function drawWordsLeft(ctx, line, x, y, color, acc){ const parts = line.split(/(\s+)/); ctx.textAlign = "left"; parts.forEach(p=>{ ctx.fillStyle = (p.trim() && acc.has(p.toUpperCase().replace(/[^A-Z0-9+$]/g,""))) ? "#ff6600" : color; ctx.fillText(p, x, y); x += ctx.measureText(p).width; }); }
function drawWordsCenter(ctx, line, cx, y, color, acc){ const w = ctx.measureText(line).width; drawWordsLeft(ctx, line, cx - w/2, y, color, acc); }
function qBox(ctx, text, x, y, w, h, fill, fs){ ctx.fillStyle = fill; roundRect(ctx, x, y, w, h, 16); ctx.fill(); ctx.strokeStyle = "#ff6600"; ctx.lineWidth = 2; roundRect(ctx, x, y, w, h, 16); ctx.stroke();
  const f = fitWrapped(ctx, [text], 500, fs, 18, w - 60, 2); ctx.font = `500 ${f.s}px ${BFONT}`; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; const lh = f.s*1.3, y0 = y + h/2 - (f.lines.length-1)*lh/2; f.lines.forEach((l,i)=>ctx.fillText(l, x + w/2, y0 + i*lh)); }
function drawBrand(canvas, g, photo, fmt){
  const story = fmt === "story", z = story ? 1.3 : 1, W = 1080, H = story ? 1920 : 1080, ctx = canvas.getContext("2d"), acc = accentWords(g);
  canvas.width = W; canvas.height = H; ctx.textBaseline = "alphabetic";
  if (g.photo && !photo){ loadPhoto(g.photo).then(im=>{ if (im && canvas.isConnected !== false) drawBrand(canvas, g, im, fmt); }); }
  if (typeof document !== "undefined" && document.fonts && !brandFontsReady()){ Promise.all(["400","500","700","800"].map(w=>document.fonts.load(`${w} 40px Poppins`))).then(()=>{ if (brandFontsReady()) drawBrand(canvas, g, photo, fmt); }).catch(()=>{}); }
  if (g.style === "stat"){
    ctx.fillStyle = g.bg || "#000000"; ctx.fillRect(0,0,W,H);
    if (photo){ const s = Math.max(W/photo.width, H/photo.height); ctx.drawImage(photo, (W-photo.width*s)*(g.photoFocusX??0.5), (H-photo.height*s)*(g.photoFocusY??0.4), photo.width*s, photo.height*s); ctx.fillStyle = `rgba(0,0,0,${g.overlay ?? 0.78})`; ctx.fillRect(0,0,W,H); }
    texture(ctx, W, H, 0.045); ctx.fillStyle = "#ff6600"; ctx.fillRect(0,0,10,H);
    if (g.pill) pillAt(ctx, g.pill, 1008, story ? 57 : 52, 40*z, 22*z, "right");
    const k = story ? 2.1 : 1, items = []; // vertical blocks
    const big = (g.headline||[""]).join(" "); ctx.font = `800 10px ${BFONT}`;
    let bs = g.headlineMax || (story ? 200 : 190); for (; bs > 60; bs -= 4){ ctx.font = `800 ${bs}px ${BFONT}`; if (ctx.measureText(big).width <= 920) break; }
    items.push({h: bs*0.82, gap: 26*k, draw:y=>{ ctx.font = `800 ${bs}px ${BFONT}`; ctx.textBaseline = "alphabetic"; drawWordsCenter(ctx, big, W/2, y + bs*0.78, "#fff", acc); }});
    items.push({h: 8, gap: 34*k, draw:y=>{ ctx.fillStyle = "#ff6600"; ctx.fillRect(80, y, 920, 8); }});
    const sub = g.supportLine || (g.headline2||[]).join(" ");
    if (sub){ const f = fitWrapped(ctx, [sub], 500, 40*z, 24, 920, 2); items.push({h: f.lines.length*f.s*1.25, gap: 26*k, draw:y=>{ ctx.font = `500 ${f.s}px ${BFONT}`; ctx.textBaseline = "top"; f.lines.forEach((l,i)=>drawWordsCenter(ctx, l, W/2, y + i*f.s*1.25, "#fff", new Set())); }}); }
    if (g.muted){ items.push({h: 32*z, gap: 40*k, draw:y=>{ ctx.font = `400 ${Math.round(26*z)}px ${BFONT}`; ctx.fillStyle = "#6b6b6b"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(g.muted, W/2, y); }}); }
    if (g.checklist){ const sp = story ? 150 : 52; items.push({h: sp*(g.checklist.length-1) + 30, gap: 40*k, draw:y=>{ g.checklist.forEach((t,i)=>{ const yy = y + i*sp; ctx.fillStyle = "#ff6600"; ctx.beginPath(); ctx.arc(90, yy+12, 8, 0, 7); ctx.fill(); ctx.font = `400 26px ${BFONT}`; ctx.fillStyle = "#d4d4d4"; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(t, 110, yy); }); }}); }
    if (g.question){ const qh = story ? 190 : 104; items.push({h: qh, gap: 0, draw:y=>qBox(ctx, g.question, 72, y, 936, qh, "#141414", 28*z)}); }
    items[items.length-1].gap = 0; const total = items.reduce((a,b)=>a+b.h+b.gap,0), top = story ? 260 : 130, bottom = H - (story ? 170 : 110);
    let y = top + Math.max(0, (bottom - top - total)/2); items.forEach(b=>{ b.draw(y); y += b.h + b.gap; });
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.font = `800 ${Math.round(34*z)}px ${BFONT}`; ctx.fillStyle = "#fff"; ctx.fillText("IndusTrack", 72, H - (story ? 120 : 52)); const ww = ctx.measureText("IndusTrack").width;
    ctx.font = `400 ${Math.round(26*z)}px ${BFONT}`; ctx.fillStyle = "#8a8a8a"; ctx.fillText(g.footer || "industrack.com", 72 + ww + 20, H - (story ? 120 : 52));
    return;
  }
  // "statement": blue, quote marks, big left-aligned headline
  ctx.fillStyle = g.bg || "#0540a5"; ctx.fillRect(0,0,W,H);
  if (photo){ const s = Math.max(W/photo.width, H/photo.height); ctx.drawImage(photo, (W-photo.width*s)*(g.photoFocusX??0.5), (H-photo.height*s)*(g.photoFocusY??0.4), photo.width*s, photo.height*s);
    const d = g.overlay ?? 0.6, gr = ctx.createLinearGradient(0,0,0,H); gr.addColorStop(0, `rgba(3,26,80,${Math.max(0,d-0.3)})`); gr.addColorStop(0.5, `rgba(3,26,80,${d})`); gr.addColorStop(1, `rgba(3,22,70,${Math.min(0.95,d+0.3)})`); ctx.fillStyle = gr; ctx.fillRect(0,0,W,H); }
  else texture(ctx, W, H, 0.05);
  const y0 = story ? 105 : 60; ctx.fillStyle = "#ff6600"; ctx.fillRect(80, y0, 78, 6); ctx.fillRect(80, y0, 6, 78);
  const quote = (x, y, sz, color)=>{ ctx.fillStyle = color; [0, 1].forEach(i=>{ const bx = x + i*sz*0.95; ctx.beginPath(); ctx.moveTo(bx + sz*0.45, y); ctx.lineTo(bx + sz*0.95, y); ctx.lineTo(bx + sz*0.5, y + sz*1.05); ctx.lineTo(bx, y + sz*1.05); ctx.closePath(); ctx.fill(); }); };
  quote(80, y0 + (story ? 160 : 90), story ? 58 : 34, photo ? "rgba(255,255,255,0.25)" : "#0a2f86");
  const footY = H - (story ? 115 : 50), rowY = H - (story ? 190 : 108);
  ctx.font = `400 ${Math.round(28*z)}px ${BFONT}`; ctx.fillStyle = "#a9bdf5"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(g.footer || "industrack.com", W/2, footY);
  ctx.font = `800 ${Math.round(38*z)}px ${BFONT}`; ctx.fillStyle = "#fff"; ctx.textAlign = "right"; ctx.fillText("IndusTrack", 1000, rowY + 23*z);
  if (g.pill) pillAt(ctx, g.pill, 80, rowY, 46*z, 22*z, "left");
  let bottomEdge = rowY - 6;
  if (g.question){ const qh = story ? 152 : 86; qBox(ctx, g.question, 80, bottomEdge - qh, 920, qh, photo ? "rgba(2,22,70,0.85)" : "#072a80", 26*z); bottomEdge -= qh; }
  quote(965, bottomEdge - (story ? 90 : 62), story ? 30 : 22, "#ff6600");
  const textBottom = bottomEdge - (story ? 150 : 100), textTop = y0 + (story ? 300 : 170);
  let sub = null; if (g.supportLine){ ctx.font = `500 30px ${BFONT}`; sub = fitWrapped(ctx, [g.supportLine], 500, story ? 40 : 30, 20, 920, 2); }
  const subH = sub ? sub.lines.length*sub.s*1.3 + 30 : 0;
  const f = fitWrapped(ctx, g.headline || [""], 700, g.headlineMax || (story ? 132 : 86), 40, 920, story ? 8 : 5);
  let lh = Math.round(f.s*1.14), blockH = lh*f.lines.length + subH;
  while (blockH > textBottom - textTop && f.s > 40){ f.s -= 2; ctx.font = `700 ${f.s}px ${BFONT}`; f.lines = (g.headline||[]).flatMap(t=>wrapWords(ctx,t,920)); lh = Math.round(f.s*1.14); blockH = lh*f.lines.length + subH; }
  let y = story ? textTop + (textBottom - textTop - blockH)*0.62 : textBottom - blockH - Math.max(0, (textBottom - textTop - blockH)*0.25);
  ctx.textBaseline = "top"; ctx.font = `700 ${f.s}px ${BFONT}`; f.lines.forEach((l,i)=>drawWordsLeft(ctx, l, 80, y + i*lh, "#fff", acc));
  if (sub){ y += lh*f.lines.length + 30; ctx.font = `500 ${sub.s}px ${BFONT}`; sub.lines.forEach((l,i)=>drawWordsLeft(ctx, l, 80, y + i*sub.s*1.3, "#dbe5ff", new Set())); }
}
function drawGraphic(canvas, g, photoImg, fmt){ if (g && (g.style === "statement" || g.style === "stat")) return drawBrand(canvas, g, photoImg, fmt); return drawClassic(canvas, g, photoImg); }
