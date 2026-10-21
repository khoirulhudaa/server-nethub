import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";

export const scrapeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ message: "URL tidak valid" });
    }

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    // ===== Baca artikel dengan Readability (paling akurat) =====
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(422).json({ message: "Tidak bisa mengekstrak artikel dari URL ini" });
    }

    // ===== Ambil gambar =====
    const $ = cheerio.load(html);
    const images = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && src.startsWith("http") && !src.includes("avatar") && !src.includes("logo")) {
        images.push({
          url: src,
          alt: $(el).attr("alt") || "",
        });
      }
    });

    // ===== Deteksi langkah-langkah sederhana =====
    const steps = [];
    const stepRegex = /(?:^|\n)\s*(?:\d+[\.\)]|\-|\*)\s+(.+?)(?=\n|$)/g;
    let match;
    const contentText = article.textContent || "";
    while ((match = stepRegex.exec(contentText)) !== null && steps.length < 15) {
      steps.push({
        title: match[1].slice(0, 80),
        description: match[1],
        image: "",
      });
    }

    res.json({
      title: article.title || "",
      excerpt: article.excerpt || article.title?.slice(0, 160) || "",
      content: article.content || "", // HTML bersih
      textContent: article.textContent || "",
      images: images.slice(0, 8),
      steps,
      sourceUrl: url,
    });
  } catch (err) {
    console.error("Scrape error:", err.message);
    next(err);
  }
};