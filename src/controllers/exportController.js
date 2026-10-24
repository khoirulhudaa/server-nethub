import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
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
const BOOK_TITLE = "NetHub IT Handbook";
const LOGO_PATH = path.resolve("assets/logo.png");

// ---------- helpers ----------
// Font bawaan PDF (Helvetica) hanya mendukung Latin → bersihkan karakter lain
const clean = (s = "") =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x20-\x7E\u00A1-\u00FF\u2022]/g, "");

const htmlToText = (html = "") =>
  clean(
    String(html)
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<li[^>]*>/gi, "\n\u2022 ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|ul|ol|pre|blockquote|tr)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );

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
    .text(text, M, doc.y, { align: "justify", lineGap: 3, ...opts.extra });
  doc.moveDown(0.6);
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
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.dark).text(clean(p.title), M, doc.y, { width: uw });
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor(C.muted)
    .text(clean(`Oleh ${p.author?.name || "Unknown"}  \u2022  ${fmtDate(p.createdAt)}`), M, doc.y);
  if (p.tags?.length) {
    doc.text(clean(`Tags: ${p.tags.join(", ")}`), M, doc.y);
  }
  doc.moveDown(0.5);
  doc.save().moveTo(M, doc.y).lineTo(M + uw, doc.y).lineWidth(1).stroke(C.line).restore();
  doc.moveDown(0.8);

  if (p.excerpt) paragraph(doc, clean(p.excerpt), { font: "Helvetica-Oblique", color: C.muted, extra: { align: "left" } });

  const body = htmlToText(p.content);
  if (body) paragraph(doc, body);

  if (p.steps?.length) {
    heading(doc, "Langkah-langkah");
    p.steps.forEach((s, i) => {
      ensureSpace(doc, 60);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.primary)
        .text(clean(`${i + 1}. ${s.title || "Langkah " + (i + 1)}`), M, doc.y);
      doc.moveDown(0.2);
      if (s.description) paragraph(doc, htmlToText(s.description));
      const buf = toImageBuffer(s.image);
      if (buf) drawImage(doc, buf);
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
    paragraph(doc, clean(`Lampiran PDF: ${p.pdfFile.name || "dokumen"} (lihat di aplikasi NetHub).`), {
      font: "Helvetica-Oblique", color: C.muted, extra: { align: "left" },
    });
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

    // ===== 1. COVER =====
    doc.save().rect(0, 0, W, H).fill(C.dark).restore();
    doc.save().rect(0, H * 0.58, W, 6).fill(C.primary).restore();
    if (fs.existsSync(LOGO_PATH)) {
      try { doc.image(LOGO_PATH, M, 80, { fit: [110, 110] }); } catch {}
    }
    doc.font("Helvetica-Bold").fontSize(44).fillColor("#ffffff").text("IT Handbook", M, 260, { width: UW });
    doc.font("Helvetica").fontSize(16).fillColor("#93c5fd")
      .text("Kumpulan Panduan Jaringan & Infrastruktur IT", M, doc.y + 8, { width: UW });
    doc.font("Helvetica").fontSize(11).fillColor("#cbd5e1")
      .text(`${posts.length} guide  \u2022  ${chapters.length} kategori`, M, H * 0.58 + 30);
    doc.text(`Diterbitkan ${fmtDate(today)}`, M, doc.y + 4);
    doc.fontSize(10).fillColor("#64748b").text(BOOK_TITLE, M, H - 80);

    // ===== 2. KATA PENGANTAR =====
    doc.addPage();
    toc.push({ label: "Kata Pengantar", page: pageIndex(doc), level: 0 });
    doc.font("Helvetica-Bold").fontSize(26).fillColor(C.dark).text("Kata Pengantar", M, M);
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
      doc.font("Helvetica").fontSize(14).fillColor("#bfdbfe").text(`BAB ${ci + 1}`, M, H * 0.38);
      doc.font("Helvetica-Bold").fontSize(40).fillColor("#ffffff").text(clean(ch.cat), M, doc.y + 6, { width: UW });
      doc.font("Helvetica").fontSize(12).fillColor("#dbeafe")
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
    doc.font("Helvetica-Bold").fontSize(26).fillColor(C.dark).text("Kata Penutup", M, M);
    doc.moveDown(1);
    paragraph(doc, "Terima kasih telah membaca buku panduan ini. Pengetahuan teknis terus berkembang, karena itu guide dalam buku ini akan diperbarui secara berkala oleh komunitas.", { size: 11 });
    paragraph(doc, "Jika Anda menemukan kekurangan atau ingin menambahkan ilmu baru, silakan berkontribusi dengan membuat guide melalui aplikasi NetHub. Setiap kontribusi sekecil apa pun sangat berarti bagi pembelajaran bersama.", { size: 11 });
    paragraph(doc, `Dokumen ini dibuat otomatis pada ${fmtDate(today)}.`, { size: 10, color: C.muted, font: "Helvetica-Oblique" });

    // ===== isi DAFTAR ISI =====
    for (let t = 0; t < tocPages; t++) {
      doc.switchToPage(tocStart + t);
      let y = M;
      if (t === 0) {
        doc.font("Helvetica-Bold").fontSize(26).fillColor(C.dark).text("Daftar Isi", M, y);
        y += 50;
      }
      const slice = toc.slice(t * perPage - (t === 0 ? 0 : 2), (t + 1) * perPage - 2);
      // hitung ulang slice sederhana: halaman 1 muat (perPage-2) entri, sisanya perPage
      void slice;
    }
    // — versi sederhana & aman: bagi entri berdasarkan kapasitas tiap halaman
    let cursor = 0;
    for (let t = 0; t < tocPages; t++) {
      doc.switchToPage(tocStart + t);
      let y = M;
      const cap = t === 0 ? perPage - 2 : perPage;
      if (t > 0) {
        // judul hanya di halaman pertama
      }
      toc.slice(cursor, cursor + cap).forEach((e) => {
        const x = M + e.level * 18;
        const label = e.label.length > 70 ? e.label.slice(0, 67) + "..." : e.label;
        const font = e.bold ? "Helvetica-Bold" : "Helvetica";
        const pageNo = String(e.page + 1);
        doc.font(font).fontSize(e.level ? 10 : 11).fillColor(C.text);
        const lw = doc.widthOfString(label);
        const nw = doc.widthOfString(pageNo);
        const yy = t === 0 ? y + 50 : y;
        doc.text(label, x, yy, { lineBreak: false });
        doc.text(pageNo, M + UW - nw, yy, { lineBreak: false });
        doc.save().moveTo(x + lw + 6, yy + 9).lineTo(M + UW - nw - 6, yy + 9)
          .dash(1, { space: 3 }).lineWidth(0.5).stroke(C.line).undash().restore();
        y += ROW;
      });
      cursor += cap;
    }

    // ===== footer nomor halaman (kecuali cover) =====
    const range = doc.bufferedPageRange();
    for (let i = 1; i < range.count; i++) {
      doc.switchToPage(i);
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