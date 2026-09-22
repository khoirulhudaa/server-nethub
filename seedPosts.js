// seedPosts.js
// Jalankan dengan: node seedPosts.js
// Pastikan .env / MONGO_URI sudah sesuai dengan project kamu.

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import Post from "./src/models/Post.js";

dotenv.config();

const MONGO_URI = "mongodb+srv://muhammadkhoirulhuda111:Or7WWpo68Y2NpUy9@cluster0.vv8acqa.mongodb.net/?appName=Cluster0" || "mongodb://127.0.0.1:27017/networking-app";

// ---- Data dummy untuk 20 post ----
const rawPosts = [
  {
    title: "Setup VLAN Dasar di Mikrotik RouterOS",
    excerpt: "Panduan lengkap membuat dan mengonfigurasi VLAN pada perangkat Mikrotik.",
    content: "VLAN (Virtual LAN) memungkinkan kamu memisahkan jaringan secara logis tanpa perlu perangkat fisik tambahan. Pada artikel ini kita akan membahas langkah-langkah konfigurasi VLAN di RouterOS mulai dari pembuatan interface, bridge, hingga tagging port.",
    category: "Topology",
    tags: ["vlan", "mikrotik", "routeros"],
    isPinned: true,
  },
  {
    title: "Cara Reset Password Router TP-Link",
    excerpt: "Langkah-langkah reset password admin pada router TP-Link yang lupa password.",
    content: "Kadang kita lupa password login router. Untungnya TP-Link menyediakan tombol reset fisik. Berikut langkah lengkap melakukan factory reset dan konfigurasi ulang router dari awal.",
    category: "Fixing",
    tags: ["tplink", "reset", "troubleshooting"],
    isPinned: true,
  },
  {
    title: "Instalasi Access Point Ubiquiti UniFi",
    excerpt: "Tutorial instalasi dan adopsi AP UniFi ke dalam controller.",
    content: "Ubiquiti UniFi menawarkan manajemen terpusat untuk banyak access point. Artikel ini membahas proses instalasi fisik, adopsi perangkat ke controller, hingga konfigurasi SSID.",
    category: "Installation",
    tags: ["ubiquiti", "unifi", "access-point"],
    isPinned: true,
  },
  {
    title: "Maintenance Rutin Switch Core Jaringan Kantor",
    excerpt: "Checklist maintenance bulanan untuk switch core agar performa tetap optimal.",
    content: "Switch core adalah tulang punggung jaringan kantor. Maintenance rutin seperti cek suhu, firmware update, dan backup konfigurasi sangat penting untuk mencegah downtime mendadak.",
    category: "Maintenance",
    tags: ["switch", "maintenance", "core-network"],
    isPinned: true,
  },
  {
    title: "Memilih Hardware Router untuk UMKM",
    excerpt: "Rekomendasi spesifikasi router yang cocok untuk kebutuhan UMKM.",
    content: "Tidak semua UMKM butuh router enterprise mahal. Artikel ini membahas pertimbangan memilih hardware router berdasarkan jumlah user, budget, dan kebutuhan fitur.",
    category: "Hardware",
    tags: ["hardware", "umkm", "router"],
    isPinned: false,
  },
  {
    title: "Troubleshooting Koneksi Internet Sering Putus",
    excerpt: "Langkah diagnosa ketika internet sering disconnect secara tiba-tiba.",
    content: "Koneksi internet yang sering putus bisa disebabkan banyak hal: kabel rusak, interferensi wireless, hingga ISP bermasalah. Berikut cara sistematis melakukan troubleshooting.",
    category: "Fixing",
    tags: ["troubleshooting", "internet", "koneksi"],
  },
  {
    title: "Konfigurasi Firewall Dasar di Mikrotik",
    excerpt: "Mengamankan jaringan dengan firewall rules dasar di RouterOS.",
    content: "Firewall adalah lapisan pertahanan utama jaringan. Pelajari cara membuat filter rules, NAT, dan address list untuk mengamankan router Mikrotik kamu dari serangan luar.",
    category: "Topology",
    tags: ["firewall", "mikrotik", "security"],
  },
  {
    title: "Topologi Star vs Mesh: Mana yang Lebih Cocok?",
    excerpt: "Perbandingan topologi jaringan star dan mesh untuk berbagai skenario.",
    content: "Pemilihan topologi jaringan mempengaruhi skalabilitas dan reliabilitas. Artikel ini membandingkan kelebihan dan kekurangan topologi star dan mesh secara mendalam.",
    category: "Topology",
    tags: ["topology", "star", "mesh"],
  },
  {
    title: "Instalasi Kabel Fiber Optic untuk Gedung Bertingkat",
    excerpt: "Panduan praktis instalasi fiber optic pada gedung bertingkat.",
    content: "Instalasi fiber optic memerlukan perencanaan jalur kabel yang matang, terutama pada gedung bertingkat. Bahas mulai dari riser, splicing, hingga testing OTDR.",
    category: "Installation",
    tags: ["fiber-optic", "installation", "gedung"],
  },
  {
    title: "Upgrade Firmware Switch Tanpa Downtime",
    excerpt: "Strategi upgrade firmware switch produksi tanpa mengganggu layanan.",
    content: "Upgrade firmware pada switch produksi berisiko menyebabkan downtime. Pelajari strategi rolling upgrade dan backup konfigurasi sebelum melakukan update.",
    category: "Maintenance",
    tags: ["firmware", "switch", "upgrade"],
  },
  {
    title: "Review Spesifikasi Mikrotik hAP ax3",
    excerpt: "Ulasan mendalam mengenai hardware Mikrotik hAP ax3 untuk rumah dan kantor kecil.",
    content: "Mikrotik hAP ax3 hadir dengan dukungan WiFi 6. Artikel ini membahas spesifikasi, performa, dan apakah worth it dibandingkan produk sekelasnya.",
    category: "Hardware",
    tags: ["mikrotik", "hap-ax3", "wifi6"],
  },
  {
    title: "Cara Mengatasi IP Conflict di Jaringan Lokal",
    excerpt: "Solusi cepat mengatasi IP address conflict pada jaringan kantor.",
    content: "IP conflict sering menyebabkan device tiba-tiba tidak bisa connect. Pelajari penyebab umum dan cara mengatasi menggunakan DHCP reservation dan static IP.",
    category: "Fixing",
    tags: ["ip-conflict", "dhcp", "troubleshooting"],
  },
  {
    title: "Desain Topologi Jaringan untuk Kantor Cabang",
    excerpt: "Merancang topologi jaringan site-to-site untuk kantor dengan banyak cabang.",
    content: "Kantor dengan banyak cabang memerlukan desain topologi yang tepat, termasuk pemilihan VPN, redundant link, dan bandwidth management.",
    category: "Topology",
    tags: ["topology", "site-to-site", "vpn"],
  },
  {
    title: "Instalasi dan Konfigurasi Awal Switch Managed",
    excerpt: "Langkah pertama setelah unboxing switch managed baru.",
    content: "Switch managed memerlukan konfigurasi awal sebelum digunakan di produksi, seperti setting VLAN default, management IP, dan port security.",
    category: "Installation",
    tags: ["switch", "managed", "installation"],
  },
  {
    title: "Jadwal Maintenance Preventif untuk Data Center Kecil",
    excerpt: "Menyusun jadwal maintenance preventif agar data center tetap andal.",
    content: "Maintenance preventif mengurangi risiko kegagalan mendadak. Bahas checklist harian, mingguan, dan bulanan untuk data center skala kecil.",
    category: "Maintenance",
    tags: ["data-center", "maintenance", "checklist"],
  },
  {
    title: "Perbandingan Hardware Mikrotik vs Ubiquiti",
    excerpt: "Mana yang lebih unggul, Mikrotik atau Ubiquiti, untuk kebutuhan enterprise?",
    content: "Mikrotik dan Ubiquiti sama-sama populer di kalangan network engineer. Artikel ini membandingkan dari sisi harga, fitur, dan kemudahan manajemen.",
    category: "Hardware",
    tags: ["mikrotik", "ubiquiti", "comparison"],
  },
  {
    title: "Cara Cepat Diagnosa Port Switch yang Mati",
    excerpt: "Langkah troubleshooting ketika salah satu port switch tidak berfungsi.",
    content: "Port switch yang mati bisa disebabkan kerusakan fisik atau masalah konfigurasi. Pelajari cara mendiagnosa dengan cepat menggunakan tools bawaan switch.",
    category: "Fixing",
    tags: ["switch", "port", "diagnosa"],
  },
  {
    title: "Membangun Topologi Redundant dengan STP",
    excerpt: "Mencegah loop jaringan menggunakan Spanning Tree Protocol.",
    content: "STP mencegah broadcast storm akibat loop pada topologi redundant. Bahas cara kerja STP, RSTP, dan konfigurasi dasarnya pada switch managed.",
    category: "Topology",
    tags: ["stp", "redundant", "loop-prevention"],
  },
  {
    title: "Panduan Instalasi Router di Rumah untuk Pemula",
    excerpt: "Langkah sederhana instalasi router baru di rumah, cocok untuk pemula.",
    content: "Belum pernah setting router sendiri? Artikel ini memandu dari unboxing, koneksi kabel, hingga setting WiFi dasar dengan bahasa yang mudah dipahami.",
    category: "Installation",
    tags: ["router", "pemula", "wifi"],
  },
  {
    title: "Tips Memperpanjang Umur Hardware Jaringan",
    excerpt: "Perawatan sederhana agar perangkat jaringan lebih awet.",
    content: "Perangkat jaringan seperti router dan switch bisa lebih awet dengan perawatan yang tepat, mulai dari ventilasi, stabilizer listrik, hingga pembersihan berkala.",
    category: "Hardware",
    tags: ["hardware", "perawatan", "tips"],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    // Cari user pertama sebagai author, atau buat dummy user kalau belum ada
    let author = await User.findOne();
    if (!author) {
      author = await User.create({
        name: "Seed Author",
        email: "seed.author@example.com",
        password: "seedpassword123", // sesuaikan kalau ada hashing wajib di model User
      });
      console.log("Dummy author dibuat:", author.email);
    } else {
      console.log("Menggunakan author existing:", author.email || author.name);
    }

    // Optional: bersihkan post lama dulu (comment out kalau tidak mau dihapus)
    // await Post.deleteMany({});
    // console.log("Post lama dihapus.");

    const postsToInsert = rawPosts.map((p, i) => ({
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: `https://picsum.photos/seed/network-${i + 1}/800/500`,
      category: p.category,
      tags: p.tags || [],
      isPinned: !!p.isPinned,
      views: Math.floor(Math.random() * 500),
      author: author._id,
      hardwareMeshes: [],
      gallery: [],
      referencesImages: [],
      steps: [],
      customTables: [],
      codeBlocks: [],
      topology: { nodes: [], edges: [] },
      flowchart: { nodes: [], edges: [] },
    }));

    const inserted = await Post.insertMany(postsToInsert);
    console.log(`Berhasil insert ${inserted.length} post.`);

    await mongoose.disconnect();
    console.log("Selesai. Koneksi ditutup.");
    process.exit(0);
  } catch (err) {
    console.error("Gagal seeding:", err);
    process.exit(1);
  }
}

seed();