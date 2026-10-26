import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import Post, { POST_CATEGORIES } from "../models/Post.js";

const C = {
  primary: "#1d4ed8",
  dark: "#0f172a",
  text: "#1e293b",
  muted: "#64748b",
  line: "#cbd5e1",
  soft: "#f1f5f9",
};
const M = 56; // margin
const IND = 18;
const BOOK_TITLE = "NetHub IT Handbook";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// controllers -> naik satu level ke src -> assets
const LOGO_PATH = path.join(__dirname, "..", "assets", "icon-512x512.png");

// ---------- helpers ----------
// Font bawaan PDF (Helvetica) hanya mendukung Latin → bersihkan karakter lain
const clean = (s = "") =>
  String(s)
    .replace(/[\u2192\u21D2\u279C\u2794]/g, "->")
    .replace(/[\u2190\u21D0]/g, "<-")
    .replace(/[\u2194\u21D4]/g, "<->")
    .replace(/[\u2713\u2714]/g, "v")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x20-\x7E\u00A1-\u00FF\u2022]/g, "");

const BULLET = "-"; // penanda list; ganti ke "•" kalau mau titik
const LIST_RE = /^\s*[-*\u2022\u2013]\s+/;                  // tetap, dipakai di <li>
const MANUAL_RE = /^\s*([-*\u2022\u2013]|\d+[.)])\s+/;    // "-", "*", "•", "–" yang diketik manual

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const parseBlocks = (html = "") => {
  let src = String(html)
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<(?![a-zA-Z\/!])/g, "&lt;");
  if (!/<[a-z][^>]*>/i.test(src)) {
    src = src
      .replace(/^[ \t]+/gm, (s) => "&nbsp;".repeat(s.replace(/\t/g, "    ").length))
      .replace(/\r?\n/g, "<br>");
  }

  const blocks = [];
  const lists = [];
  let buf = "";
  let inPre = false;
  let inHeading = false;
  let li = null;
  let numBase = 0; // > 0 = sedang berada di bawah item "N. judul" manual

  // Pecah teks per baris; dipakai untuk paragraf (base = null) dan isi <li> (base = {depth, marker})
  const emitLines = (text, base) => {
    let cur = null;
    let usedBase = false;

    const close = () => {
      if (cur && cur.lines.length) {
        const { lines, ...rest } = cur;
        blocks.push({ ...rest, text: lines.join("\n") });
        if (rest.type === "p") numBase = 0;
      }
      cur = null;
    };

    const openPlain = () => {
      if (base) {
        cur = { type: "li", depth: base.depth, marker: usedBase ? null : base.marker, lines: [] };
        usedBase = true;
      } else {
        cur = { type: "p", lines: [] };
      }
    };

    text.split("\n").forEach((line) => {
      if (!line.trim()) return close();

      const mm = MANUAL_RE.exec(line);
      if (mm) {
        close();
        usedBase = true; // marker manual menggantikan marker <li> → tidak dobel
        const isNum = /\d/.test(mm[1]);
        const lead = line.match(/^\s*/)[0].length;
        const baseDepth = base ? base.depth : Math.min(3, Math.floor(lead / 2));

        let depth;
        if (isNum) {
          depth = numBase > 0 ? numBase - 1 : baseDepth; // angka selalu di level yang sama
          numBase = depth + 1;
        } else {
          depth = Math.max(baseDepth, numBase); // bullet di bawah angka → menjorok
        }

        cur = {
          type: "li",
          depth,
          marker: isNum ? mm[1] : BULLET,
          lines: [line.replace(MANUAL_RE, "").trim()],
        };
        return;
      }

      if (!cur) openPlain();
      cur.lines.push(line.trim());
    });
    close();
  };

  const flush = () => {
    const raw = buf;
    buf = "";

    if (inPre) {
      const code = clean(decodeEntities(raw)).replace(/\n+$/, "");
      if (code.trim()) blocks.push({ type: "code", text: code });
      return;
    }

    const text = clean(decodeEntities(raw))
      .replace(/[ \t]+\n/g, "\n")
      .replace(/^\n+|\n+$/g, "")
      .trimEnd();
    if (!text.trim()) return;

    if (inHeading) {
      blocks.push({ type: "h", text: text.replace(/\n/g, " ").trim() });
      return;
    }

    if (li) {
      const isBulletItem = li.marker === BULLET || li.marker === null;
      emitLines(text, {
        depth: li.depth + (isBulletItem ? numBase : 0),
        marker: li.marker,
      });
      li.marker = null;
      return;
    }

    emitLines(text, null);
  };

  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[3] !== undefined) {
      buf += inPre ? m[3] : m[3].replace(/\s+/g, " ");
      continue;
    }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();

    if (tag === "br") { buf += "\n"; continue; }

    if (/^h[1-6]$/.test(tag)) { flush(); inHeading = !closing; numBase = 0; continue; }

    if (tag === "ul" || tag === "ol") {
      flush();
      if (closing) { lists.pop(); li = null; }
      else lists.push({ ordered: tag === "ol", n: 0 });
      continue;
    }

    if (tag === "li") {
      flush();
      if (closing) li = null;
      else {
        const top = lists[lists.length - 1] || { ordered: false, n: 0 };
        const ind = /ql-indent-(\d+)/.exec(m[0]);
        const isBullet = /data-list="bullet"/.test(m[0]);
        const ordered = top.ordered && !isBullet;
        if (ordered) { top.n += 1; numBase = 0; }
        li = {
          depth: ind ? Number(ind[1]) : Math.max(0, lists.length - 1),
          marker: ordered ? `${top.n}.` : BULLET,
        };
      }
      continue;
    }

    if (tag === "pre") { flush(); inPre = !closing; continue; }

    if ((tag === "td" || tag === "th") && closing) { buf += "  "; continue; }

    if (["p", "div", "blockquote", "section", "tr", "table"].includes(tag)) flush();
  }
  flush();
  return blocks;
};

// Gambar blok-blok tadi dengan jarak yang rapat & konsisten
const renderRich = (doc, html, { size = 10.5 } = {}) => {
  const UW = doc.page.width - 2 * M;
  let prev = null;

  parseBlocks(html).forEach((b) => {
    if (b.type === "h") {
      ensureSpace(doc, 46);
      doc.y += 4;
      doc.font("Helvetica-Bold").fontSize(12).fillColor(C.dark).text(b.text, M, doc.y, { width: UW });
      doc.y += 4;
    } else if (b.type === "code") {
      codeBlock(doc, { code: b.text });
    } else if (b.type === "li") {
      const x0 = M + b.depth * IND;
      const tx = x0 + IND;
      const w = M + UW - tx;
      doc.font("Helvetica").fontSize(size);
      const h = doc.heightOfString(b.text, { width: w, lineGap: 2 });
      ensureSpace(doc, Math.min(h, 60));
      const y = doc.y;
      if (b.marker) doc.fillColor(C.muted).text(b.marker, x0, y, { width: IND, lineBreak: false });
      doc.fillColor(C.text).text(b.text, tx, y, { width: w, lineGap: 2 });
      doc.x = M;
      doc.y += 3;
    } else {
      if (prev === "li") doc.y += 3;
      doc.font("Helvetica").fontSize(size).fillColor(C.text)
        .text(b.text, M, doc.y, { width: UW, align: "left", lineGap: 2 });
      doc.y += 6;
    }
    prev = b.type;
  });
  doc.x = M;
};

// pdfkit hanya mendukung PNG & JPEG
const toImageBuffer = (src) => {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(src || "");
  return m ? Buffer.from(m[2], "base64") : null;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });


const pageIndex = (doc) => {
  const r = doc.bufferedPageRange();
  return r.start + r.count - 1;
};

const drawOrnament = (doc) => {
  const W = doc.page.width;
  const H = doc.page.height;
  const UW = W - 2 * M;

  doc.save();

  // 2. Lingkaran konsentris samar di pojok kanan atas
  [70, 52, 34].forEach((r, i) => {
    doc.circle(W, 0, r).lineWidth(0.8).strokeOpacity(0.35 - i * 0.08).stroke(C.primary);
  });
  doc.strokeOpacity(1);

  // 3. Pola titik di pojok kiri bawah
  doc.fillOpacity(0.35);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      doc.circle(M + c * 7, H - 100 + r * 7, 1.1).fill(C.primary);
    }
  }
  doc.fillOpacity(1);

  // 4. Garis footer + aksen tebal di kiri
  doc.moveTo(M, H - 46).lineTo(M + UW, H - 46).lineWidth(0.5).stroke(C.line);
  doc.moveTo(M, H - 46).lineTo(M + 36, H - 46).lineWidth(2).stroke(C.primary);

  doc.restore();
};

const ensureSpace = (doc, h) => {
  if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
};

const heading = (doc, text, size = 13) => {
  ensureSpace(doc, 50);
  doc.moveDown(0.8).font("Helvetica-Bold").fontSize(size).fillColor(C.dark).text(clean(text), M, doc.y);
  doc.moveDown(0.3);
};

const paragraph = (doc, text, opts = {}) => {
  doc.font(opts.font || "Helvetica").fontSize(opts.size || 10.5).fillColor(opts.color || C.text)
    .text(text, M, doc.y, { align: "justify", lineGap: 2, ...opts.extra });
  doc.y += 6;
};

const drawImage = (doc, buf, maxH = 220) => {
  try {
    const uw = doc.page.width - 2 * M;
    const img = doc.openImage(buf);
    const scale = Math.min(uw / img.width, maxH / img.height, 1);
    const h = img.height * scale;
    ensureSpace(doc, h + 10);
    doc.image(buf, M, doc.y, { fit: [uw, maxH] });
    doc.y += 0; // pdfkit otomatis menggeser y
    doc.moveDown(0.6);
  } catch {
    /* gambar rusak → lewati */
  }
};

const codeBlock = (doc, { title, language, code }) => {
  const uw = doc.page.width - 2 * M;
  if (title || language) {
    ensureSpace(doc, 40);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.muted)
      .text(clean(`${title || "Code"}${language ? `  [${language}]` : ""}`), M, doc.y);
    doc.moveDown(0.2);
  }
  const lines = clean(code).split("\n").flatMap((l) => l.match(/.{1,88}/g) || [""]);
  lines.forEach((line) => {
    ensureSpace(doc, 13);
    const y = doc.y;
    doc.save().rect(M, y, uw, 12).fill(C.soft).restore();
    doc.font("Courier").fontSize(8.5).fillColor(C.dark)
      .text(line, M + 8, y + 2, { width: uw - 16, lineBreak: false });
    doc.y = y + 12;
  });
  doc.x = M;
  doc.moveDown(0.8);
};

const drawTable = (doc, table) => {
  const rows = (table.data || []).map((r) => r.map((c) => clean(c)));
  if (!rows.length) return;
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const uw = doc.page.width - 2 * M;
  const cw = uw / cols;

  if (table.title) heading(doc, table.title, 11);

  rows.forEach((row, ri) => {
    doc.font(ri === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    const h = Math.max(18, ...Array.from({ length: cols }, (_, i) =>
      doc.heightOfString(row[i] || " ", { width: cw - 10 }) + 8));
    ensureSpace(doc, h);
    const y = doc.y;
    for (let i = 0; i < cols; i++) {
      const x = M + i * cw;
      doc.save().rect(x, y, cw, h).fillAndStroke(ri === 0 ? C.soft : "#ffffff", C.line).restore();
      doc.font(ri === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(C.text)
        .text(row[i] || "", x + 5, y + 4, { width: cw - 10 });
    }
    doc.y = y + h;
  });
  doc.x = M;
  doc.moveDown(0.8);
};

// ---------- render satu guide ----------
const renderGuide = (doc, p, no) => {
  const uw = doc.page.width - 2 * M;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.primary)
    .text(clean(`${p.category.toUpperCase()}  /  GUIDE ${no}`), M, M);
  doc.y += 4;
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.dark).text(clean(p.title), M, doc.y, { width: uw });
  doc.y += 4;
  doc.font("Helvetica").fontSize(9).fillColor(C.muted)
    .text(clean(`Oleh ${p.author?.name || "Unknown"}  \u2022  ${fmtDate(p.createdAt)}`), M, doc.y);
  if (p.tags?.length) doc.text(clean(`Tags: ${p.tags.join(", ")}`), M, doc.y);
  doc.y += 8;
  doc.save().moveTo(M, doc.y).lineTo(M + uw, doc.y).lineWidth(0.5).stroke(C.line).restore();
  doc.y += 12;

  if (p.excerpt) {
    doc.font("Helvetica-Oblique").fontSize(10.5).fillColor(C.muted)
      .text(clean(p.excerpt), M, doc.y, { width: uw, lineGap: 2 });
    doc.y += 8;
  }

  renderRich(doc, p.content);

  if (p.steps?.length) {
    heading(doc, "Langkah-langkah");
    p.steps.forEach((s, i) => {
      ensureSpace(doc, 60);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.primary)
        .text(clean(`${i + 1}. ${s.title || "Langkah " + (i + 1)}`), M, doc.y);
      doc.y += 3;
      if (s.description) renderRich(doc, s.description);
      const buf = toImageBuffer(s.image);
      if (buf) drawImage(doc, buf);
      doc.y += 4;
    });
  }

  if (p.codeBlocks?.length) {
    heading(doc, "Konfigurasi / Script");
    p.codeBlocks.forEach((b) => codeBlock(doc, b));
  }

  if (p.customTables?.length) {
    heading(doc, "Tabel");
    p.customTables.forEach((t) => drawTable(doc, t));
  }

  if (p.pdfFile?.url) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor(C.muted)
      .text(clean(`Lampiran PDF: ${p.pdfFile.name || "dokumen"} (lihat di aplikasi NetHub).`), M, doc.y, { width: uw });
  }
};

// ---------- controller utama ----------
export const exportAllGuidesPdf = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .select("title category tags excerpt content steps codeBlocks customTables pdfFile author createdAt")
      .populate("author", "name")
      .sort({ createdAt: 1 })
      .lean();

    if (!posts.length) return res.status(404).json({ message: "Belum ada guide" });

    const chapters = POST_CATEGORIES
      .map((cat) => ({ cat, items: posts.filter((p) => p.category === cat) }))
      .filter((g) => g.items.length);

    const doc = new PDFDocument({
      size: "A4",
      margin: M,
      bufferPages: true,
      info: { Title: BOOK_TITLE, Author: "NetHub Community" },
    });

    const today = new Date();
    const fileName = `NetHub-IT-Handbook-${today.toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    doc.pipe(res);

    const W = doc.page.width;
    const H = doc.page.height;
    const UW = W - 2 * M;
    const toc = []; // { label, page, level }

    const dividerPages = new Set();

    // ===== 1. // ===== 1. COVER =====
    // margin bawah dimatikan sementara supaya teks di dasar cover tidak memicu halaman baru
    const coverBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.save().rect(0, 0, W, H).fill(C.dark).restore();

    const LOGO_SIZE = 150;
    const LOGO_X = M - 16;          // geser kiri untuk mengkompensasi padding transparan PNG
    const LOGO_Y = M;
    const TITLE_Y = LOGO_Y + LOGO_SIZE + 28; // jarak tetap di bawah logo

    if (fs.existsSync(LOGO_PATH)) {
    try {
        doc.image(LOGO_PATH, LOGO_X, LOGO_Y, { fit: [LOGO_SIZE, LOGO_SIZE] });
    } catch (e) {
        console.error("Gagal load logo:", e.message);
    }
    }

    doc.font("Helvetica-Bold").fontSize(46).fillColor("#ffffff")
    .text("IT Handbook", M, TITLE_Y, { width: UW });
    doc.font("Helvetica").fontSize(15).fillColor("#93c5fd")
    .text("Kumpulan Panduan Jaringan & Infrastruktur IT", M, doc.y + 4, { width: UW });

    doc.font("Helvetica").fontSize(11).fillColor("#cbd5e1")
    .text(`${posts.length} guide  \u2022  ${chapters.length} kategori`, M, doc.y + 22);
    doc.text(`Diterbitkan ${fmtDate(today)}`, M, doc.y + 2);

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#64748b")
    .text("ISI BUKU", M, doc.y + 30);
    doc.font("Helvetica").fontSize(10.5).fillColor("#94a3b8")
    .text(chapters.map((c) => `${c.cat} (${c.items.length})`).join("   \u2022   "), M, doc.y + 6, {
        width: UW,
        lineGap: 4,
    });

    doc.font("Helvetica").fontSize(9).fillColor("#64748b")
    .text(BOOK_TITLE, M, H - 60, { width: UW, lineBreak: false });

    doc.page.margins.bottom = coverBottom; // kembalikan untuk halaman berikutnya;

    // ===== 2. KATA PENGANTAR =====
    doc.addPage();
    toc.push({ label: "Kata Pengantar", page: pageIndex(doc), level: 0 });
    dividerPages.add(pageIndex(doc));
    doc.font("Helvetica-Bold").fontSize(20).fillColor(C.dark).text("Kata Pengantar", M, M);
    doc.moveDown(1);
    paragraph(doc, "Buku panduan ini merupakan kumpulan guide yang ditulis dan dibagikan oleh komunitas NetHub. Isinya mencakup berbagai topik seputar jaringan dan infrastruktur IT, mulai dari topologi, instalasi, pemeliharaan, hingga perangkat keras dan sistem-sistem pendukung.", { size: 11 });
    paragraph(doc, "Setiap guide disusun per kategori dalam bentuk bab, sehingga mudah dicari dan dijadikan referensi kerja sehari-hari. Gunakan daftar isi di halaman berikutnya untuk menuju topik yang Anda butuhkan.", { size: 11 });
    paragraph(doc, `Edisi ini memuat ${posts.length} guide dalam ${chapters.length} kategori dan akan terus bertambah seiring kontribusi anggota komunitas.`, { size: 11 });
    paragraph(doc, "Selamat belajar dan semoga bermanfaat.", { size: 11, font: "Helvetica-Oblique" });

    // ===== 3. DAFTAR ISI (halaman dicadangkan dulu, diisi belakangan) =====
    const ROW = 20;
    const perPage = Math.floor((H - 2 * M) / ROW) - 2;
    const tocEntriesCount = 2 + chapters.length + posts.length + 1; // +1 buat judul "Daftar Isi"
    const tocPages = Math.ceil(tocEntriesCount / perPage);
    doc.addPage();
    const tocStart = pageIndex(doc);
    for (let i = 1; i < tocPages; i++) doc.addPage();

    // ===== 4. ISI: BAB PER KATEGORI =====
    chapters.forEach((ch, ci) => {
      doc.addPage();
      toc.push({ label: `Bab ${ci + 1}. ${ch.cat}`, page: pageIndex(doc), level: 0, bold: true });
      doc.save().rect(0, 0, W, H).fill(C.primary).restore();
      doc.font("Helvetica").fontSize(12).fillColor("#bfdbfe").text(`BAB ${ci + 1}`, M, H * 0.38);
      doc.font("Helvetica-Bold").fontSize(30).fillColor("#ffffff").text(clean(ch.cat), M, doc.y + 6, { width: UW });
      doc.font("Helvetica").fontSize(11).fillColor("#dbeafe")
        .text(`${ch.items.length} guide`, M, doc.y + 8);

      ch.items.forEach((p, gi) => {
        doc.addPage();
        toc.push({ label: `${ci + 1}.${gi + 1}  ${clean(p.title)}`, page: pageIndex(doc), level: 1 });
        renderGuide(doc, p, `${ci + 1}.${gi + 1}`);
      });
    });

    // ===== 5. KATA PENUTUP =====
    doc.addPage();
    toc.push({ label: "Kata Penutup", page: pageIndex(doc), level: 0 });
    doc.font("Helvetica-Bold").fontSize(20).fillColor(C.dark).text("Kata Penutup", M, M);
    doc.moveDown(1);
    paragraph(doc, "Terima kasih telah membaca buku panduan ini. Pengetahuan teknis terus berkembang, karena itu guide dalam buku ini akan diperbarui secara berkala oleh komunitas.", { size: 11 });
    paragraph(doc, "Jika Anda menemukan kekurangan atau ingin menambahkan ilmu baru, silakan berkontribusi dengan membuat guide melalui aplikasi NetHub. Setiap kontribusi sekecil apa pun sangat berarti bagi pembelajaran bersama.", { size: 11 });
    paragraph(doc, `Dokumen ini dibuat otomatis pada ${fmtDate(today)}.`, { size: 10, color: C.muted, font: "Helvetica-Oblique" });

    // ===== isi DAFTAR ISI =====
    let cursor = 0;
    for (let t = 0; t < tocPages; t++) {
    doc.switchToPage(tocStart + t);
    let y = M;
    if (t === 0) {
        doc.font("Helvetica-Bold").fontSize(20).fillColor(C.dark).text("Daftar Isi", M, y);
        y += 42;
    }
    const cap = t === 0 ? perPage - 2 : perPage;
    toc.slice(cursor, cursor + cap).forEach((e) => {
        const x = M + e.level * 18;
        const label = e.label.length > 70 ? e.label.slice(0, 67) + "..." : e.label;
        const pageNo = String(e.page + 1);
        doc.font(e.bold ? "Helvetica-Bold" : "Helvetica").fontSize(e.level ? 10 : 11).fillColor(C.text);
        const lw = doc.widthOfString(label);
        const nw = doc.widthOfString(pageNo);
        doc.text(label, x, y, { lineBreak: false });
        doc.text(pageNo, M + UW - nw, y, { lineBreak: false });
        doc.save().moveTo(x + lw + 6, y + 9).lineTo(M + UW - nw - 6, y + 9)
        .dash(1, { space: 3 }).lineWidth(0.5).stroke(C.line).undash().restore();
        y += ROW;
    });
    cursor += cap;
    }

    // ===== footer nomor halaman (kecuali cover) =====
    const range = doc.bufferedPageRange();
    for (let i = 1; i < range.count; i++) {
      doc.switchToPage(i);
      if (!dividerPages.has(i)) drawOrnament(doc);
      const oldBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // cegah auto page-break saat nulis footer
      doc.font("Helvetica").fontSize(8).fillColor(C.muted);
      doc.text(BOOK_TITLE, M, H - 36, { width: UW, align: "left", lineBreak: false });
      doc.text(`Halaman ${i + 1}`, M, H - 36, { width: UW, align: "right", lineBreak: false });
      doc.page.margins.bottom = oldBottom;
    }

    doc.end();
  } catch (err) {
    if (res.headersSent) return res.end();
    next(err);
  }
};