// utils/cableRules.js

export const CABLE_RULES = {
  // ====================== ROUTER ======================
  "Router-Switch": ["utp", "fiber"],
  "Router-Switch PoE": ["utp", "fiber"],
  "Router-Firewall": ["utp", "fiber"],
  "Router-Server": ["utp", "fiber"],
  "Router-PC": ["utp"],
  "Router-Laptop": ["utp"],
  "Router-Access Point": ["utp"],
  "Router-MikroTik": ["utp", "fiber"],
  "Router-Router": ["utp", "fiber"],
  "Router-Printer/FC": ["utp"],
  "Router-DVR/DVR": ["utp"],
  "Router-Modem": ["utp", "fiber"],
  "Router-Load Balancer": ["utp", "fiber"],
  "Router-Media Converter": ["utp", "fiber"],
  "Router-Fiber Media Converter": ["utp", "fiber"],
  "Router-NAS": ["utp", "fiber"],
  "Router-Cloud": ["utp", "fiber", "wireless"],
  "Router-Wireless Controller": ["utp", "fiber"],

  // ====================== MIKROTIK ======================
  "MikroTik-Switch": ["utp", "fiber"],
  "MikroTik-Switch PoE": ["utp", "fiber"],
  "MikroTik-Firewall": ["utp", "fiber"],
  "MikroTik-Server": ["utp", "fiber"],
  "MikroTik-PC": ["utp"],
  "MikroTik-Laptop": ["utp"],
  "MikroTik-Access Point": ["utp"],
  "MikroTik-MikroTik": ["utp", "fiber"],
  "MikroTik-Printer/FC": ["utp"],
  "MikroTik-DVR/DVR": ["utp"],
  "MikroTik-Modem": ["utp", "fiber"],
  "MikroTik-Load Balancer": ["utp", "fiber"],
  "MikroTik-Media Converter": ["utp", "fiber"],
  "MikroTik-Fiber Media Converter": ["utp", "fiber"],
  "MikroTik-NAS": ["utp", "fiber"],
  "MikroTik-Wireless Controller": ["utp", "fiber"],

  // ====================== FIREWALL ======================
  "Firewall-Switch": ["utp", "fiber"],
  "Firewall-Switch PoE": ["utp", "fiber"],
  "Firewall-Server": ["utp", "fiber"],
  "Firewall-PC": ["utp"],
  "Firewall-Laptop": ["utp"],
  "Firewall-Access Point": ["utp"],
  "Firewall-Firewall": ["utp", "fiber"],
  "Firewall-Printer/FC": ["utp"],
  "Firewall-DVR/DVR": ["utp"],
  "Firewall-Load Balancer": ["utp", "fiber"],
  "Firewall-Media Converter": ["utp", "fiber"],
  "Firewall-Fiber Media Converter": ["utp", "fiber"],
  "Firewall-NAS": ["utp", "fiber"],
  "Firewall-Wireless Controller": ["utp", "fiber"],

  // ====================== SWITCH & SWITCH PoE ======================
  "Switch-Switch": ["utp", "fiber"],
  "Switch-Switch PoE": ["utp", "fiber"],
  "Switch PoE-Switch PoE": ["utp", "fiber"],
  "Switch-PC": ["utp"],
  "Switch-Laptop": ["utp"],
  "Switch-Server": ["utp", "fiber"],
  "Switch-Access Point": ["utp"],
  "Switch PoE-Access Point": ["utp"],           // PoE power + data
  "Switch-Printer/FC": ["utp"],
  "Switch-CCTV IP": ["utp"],
  "Switch PoE-CCTV IP": ["utp"],                // PoE CCTV
  "Switch-CCTV Analog": [],                     // tidak boleh
  "Switch-DVR/DVR": ["utp"],
  "Switch-Telepon": ["utp"],
  "Switch-Hub": ["utp"],
  "Switch-Bridge": ["utp", "fiber"],
  "Switch-NAS": ["utp", "fiber"],
  "Switch-Media Converter": ["utp", "fiber"],
  "Switch-Fiber Media Converter": ["utp", "fiber"],
  "Switch-Load Balancer": ["utp", "fiber"],
  "Switch-Wireless Controller": ["utp", "fiber"],
  "Switch-UPS": ["utp"],

  // ====================== ACCESS POINT ======================
  "Access Point-PC": ["wireless", "utp"],
  "Access Point-Laptop": ["wireless", "utp"],
  "Access Point-Smartphone": ["wireless"],
  "Access Point-Server": ["utp"],
  "Access Point-Access Point": ["wireless", "utp"],
  "Access Point-Printer/FC": ["utp", "wireless"],
  "Access Point-Telepon": ["wireless"],
  "Access Point-Wireless Controller": ["utp", "wireless"],

  // ====================== SERVER ======================
  "Server-PC": ["utp"],
  "Server-Laptop": ["utp"],
  "Server-Server": ["utp", "fiber"],
  "Server-Printer/FC": ["utp"],
  "Server-DVR/DVR": ["utp"],
  "Server-NAS": ["utp", "fiber"],
  "Server-Load Balancer": ["utp", "fiber"],
  "Server-Media Converter": ["utp", "fiber"],
  "Server-Fiber Media Converter": ["utp", "fiber"],

  // ====================== CCTV IP ======================
  "CCTV IP-Switch": ["utp"],
  "CCTV IP-Switch PoE": ["utp"],
  "CCTV IP-Server": ["utp"],
  "CCTV IP-NAS": ["utp"],
  "CCTV IP-DVR/DVR": ["utp"],                   // NVR biasanya
  "CCTV IP-PC": ["utp"],
  "CCTV IP-Laptop": ["utp"],

  // ====================== CCTV ANALOG ======================
  "CCTV Analog-DVR/DVR": ["rg59", "coaxial", "bnc"],
  "CCTV Analog-Power Supply DVR": ["power"],
  "CCTV Analog-Monitor": ["hdmi", "vga", "bnc"], // via DVR biasanya

  // ====================== DVR ======================
  "DVR/DVR-PC": ["utp", "hdmi", "vga", "usb"],
  "DVR/DVR-Laptop": ["utp", "hdmi", "vga", "usb"],
  "DVR/DVR-Server": ["utp"],
  "DVR/DVR-Switch": ["utp"],
  "DVR/DVR-NAS": ["utp"],
  "DVR/DVR-Monitor": ["hdmi", "vga"],
  "DVR/DVR-Power Supply DVR": ["power"],
  "DVR/DVR-Mouse": ["usb"],
  "DVR/DVR-Keyboard": ["usb"],

  // ====================== POWER SUPPLY DVR ======================
  "Power Supply DVR-CCTV Analog": ["power"],
  "Power Supply DVR-DVR/DVR": ["power"],

  // ====================== MONITOR ======================
  "Monitor-PC": ["hdmi", "vga"],
  "Monitor-Laptop": ["hdmi", "vga"],
  "Monitor-DVR/DVR": ["hdmi", "vga"],
  "Monitor-Server": ["hdmi", "vga"],

  // ====================== MOUSE & KEYBOARD ======================
  "Mouse-PC": ["usb"],
  "Mouse-Laptop": ["usb"],
  "Mouse-DVR/DVR": ["usb"],
  "Keyboard-PC": ["usb"],
  "Keyboard-Laptop": ["usb"],
  "Keyboard-DVR/DVR": ["usb"],

  // ====================== PRINTER ======================
  "Printer/FC-PC": ["utp", "usb"],
  "Printer/FC-Laptop": ["utp", "usb"],
  "Printer/FC-Server": ["utp"],
  "Printer/FC-Switch": ["utp"],
  "Printer/FC-Access Point": ["utp", "wireless"],

  // ====================== TELEPON ======================
  "Telepon-Switch": ["utp"],
  "Telepon-PC": ["utp"],
  "Telepon-Laptop": ["utp"],
  "Telepon-Access Point": ["wireless"],

  // ====================== MODEM ======================
  "Modem-Router": ["utp", "fiber"],
  "Modem-MikroTik": ["utp", "fiber"],
  "Modem-Firewall": ["utp", "fiber"],
  "Modem-Switch": ["utp"],
  "Modem-PC": ["utp"],
  "Modem-Laptop": ["utp"],

  // ====================== HUB ======================
  "Hub-Switch": ["utp"],
  "Hub-PC": ["utp"],
  "Hub-Laptop": ["utp"],
  "Hub-Server": ["utp"],
  "Hub-Printer/FC": ["utp"],

  // ====================== BRIDGE ======================
  "Bridge-Switch": ["utp", "fiber"],
  "Bridge-Router": ["utp", "fiber"],
  "Bridge-Access Point": ["utp", "wireless"],
  "Bridge-Bridge": ["utp", "fiber", "wireless"],

  // ====================== NAS ======================
  "NAS-PC": ["utp"],
  "NAS-Laptop": ["utp"],
  "NAS-Server": ["utp", "fiber"],
  "NAS-Switch": ["utp", "fiber"],
  "NAS-Access Point": ["utp"],

  // ====================== MEDIA CONVERTER & FIBER MEDIA CONVERTER ======================
  "Media Converter-Switch": ["utp", "fiber"],
  "Media Converter-Router": ["utp", "fiber"],
  "Media Converter-MikroTik": ["utp", "fiber"],
  "Media Converter-Firewall": ["utp", "fiber"],
  "Media Converter-Server": ["utp", "fiber"],
  "Fiber Media Converter-Switch": ["utp", "fiber"],
  "Fiber Media Converter-Router": ["utp", "fiber"],
  "Fiber Media Converter-MikroTik": ["utp", "fiber"],
  "Fiber Media Converter-Firewall": ["utp", "fiber"],
  "Fiber Media Converter-Server": ["utp", "fiber"],
  "Fiber Media Converter-Media Converter": ["fiber"],

  // ====================== LOAD BALANCER ======================
  "Load Balancer-Switch": ["utp", "fiber"],
  "Load Balancer-Server": ["utp", "fiber"],
  "Load Balancer-Firewall": ["utp", "fiber"],
  "Load Balancer-Router": ["utp", "fiber"],

  // ====================== WIRELESS CONTROLLER ======================
  "Wireless Controller-Switch": ["utp", "fiber"],
  "Wireless Controller-Access Point": ["utp", "wireless"],
  "Wireless Controller-Router": ["utp", "fiber"],
  "Wireless Controller-Firewall": ["utp", "fiber"],

  // ====================== UPS ======================
  "UPS-Switch": ["utp"],
  "UPS-Server": ["utp"],
  "UPS-Router": ["utp"],
  "UPS-PC": ["utp"],
  "UPS-DVR/DVR": ["utp", "power"],

  // ====================== SMARTPHONE / LAPTOP ======================
  "Smartphone-Access Point": ["wireless"],
  "Smartphone-Router": ["wireless"],
  "Laptop-Access Point": ["wireless", "utp"],
  "Laptop-Switch": ["utp"],
  "Laptop-PC": ["utp", "usb"],
};

/**
 * Alasan lengkap kenapa kabel tertentu dilarang / tidak disarankan
 */
const REASON_MAP = {
  coaxial: {
    "Router-Switch": "Coaxial jarang dipakai di jaringan modern. Router dan Switch umumnya menggunakan port RJ45 (UTP) atau SFP (Fiber).",
    "Switch-PC": "PC tidak memiliki port coaxial.",
    "Switch-Server": "Server memakai NIC Ethernet (UTP) atau Fiber.",
    "CCTV IP-Switch": "CCTV IP menggunakan UTP, bukan coaxial.",
    default: "Kabel Coaxial (RG6) lebih umum untuk CCTV analog / TV, bukan data network modern.",
  },

  rg59: {
    "CCTV IP-Switch": "CCTV IP tidak menggunakan RG59. Gunakan UTP.",
    "CCTV IP-DVR/DVR": "CCTV IP ke NVR/DVR menggunakan UTP, bukan RG59.",
    "Router-Switch": "RG59 tidak digunakan untuk koneksi data antar perangkat network modern.",
    "Switch-PC": "PC tidak punya port RG59.",
    default: "Kabel RG59 khusus untuk CCTV analog (video + power di beberapa kasus). Tidak cocok untuk data Ethernet.",
  },

  bnc: {
    "CCTV IP-Switch": "CCTV IP tidak memakai konektor BNC. Gunakan RJ45 (UTP).",
    "Router-Switch": "BNC bukan konektor standar untuk Router/Switch modern.",
    "Switch-PC": "PC tidak memiliki port BNC.",
    "DVR/DVR-PC": "Untuk monitoring, lebih baik pakai HDMI/VGA. BNC biasanya hanya di sisi kamera analog.",
    default: "Konektor BNC digunakan pada CCTV analog (kamera → DVR). Tidak dipakai di perangkat network IP modern.",
  },

  serial: {
    "Router-Switch": "Serial/Console hanya untuk konfigurasi awal (CLI), bukan lalu lintas data.",
    "Switch-PC": "Port serial untuk console management, bukan data user.",
    "Router-PC": "Kabel console hanya untuk konfigurasi, bukan akses data/internet.",
    default: "Kabel Serial/Console hanya untuk management & konfigurasi, bukan transmisi data jaringan.",
  },

  power: {
    "Router-Switch": "Kabel Power hanya untuk listrik, tidak bisa membawa data.",
    "Switch-PC": "Kabel Power tidak membawa data jaringan.",
    "CCTV IP-Switch": "CCTV IP biasanya di-power via PoE (UTP) atau adaptor terpisah, bukan kabel power biasa antar perangkat data.",
    default: "Kabel Power hanya untuk aliran listrik. Tidak bisa digunakan untuk mengirim data jaringan.",
  },

  hdmi: {
    "Router-Switch": "HDMI adalah kabel video/audio, bukan kabel data network.",
    "Switch-PC": "HDMI tidak digunakan untuk koneksi jaringan.",
    "CCTV IP-Switch": "CCTV IP menggunakan UTP, bukan HDMI.",
    "CCTV Analog-DVR/DVR": "Antara kamera analog dan DVR biasanya pakai RG59/BNC, bukan HDMI.",
    default: "Kabel HDMI digunakan untuk transmisi video/audio (Monitor, DVR ke TV/Monitor). Bukan untuk data jaringan.",
  },

  vga: {
    "Router-Switch": "VGA adalah kabel video analog, bukan kabel data network.",
    "Switch-PC": "VGA tidak digunakan untuk koneksi jaringan.",
    "CCTV IP-Switch": "CCTV IP tidak memakai VGA.",
    default: "Kabel VGA digunakan untuk output video analog (Monitor lama, DVR). Bukan untuk data jaringan.",
  },

  usb: {
    "Router-Switch": "USB bukan media transmisi data antar perangkat network infrastruktur.",
    "Switch-PC": "Meskipun ada USB-Ethernet adapter, secara native Switch ke PC memakai UTP.",
    "CCTV IP-Switch": "CCTV IP tidak dihubungkan via USB ke Switch.",
    "CCTV Analog-DVR/DVR": "Kamera analog tidak memakai USB ke DVR.",
    default: "Kabel USB cocok untuk peripheral (Mouse, Keyboard, Printer, storage) dan beberapa koneksi langsung PC-ke-device, bukan backbone jaringan.",
  },

  wireless: {
    "Router-Switch": "Router dan Switch sebaiknya dihubungkan fisik (UTP/Fiber) agar stabil dan berkecepatan tinggi.",
    "Switch-Switch": "Antar Switch (backbone) tidak disarankan wireless.",
    "Switch-Server": "Server membutuhkan koneksi stabil dan low-latency. Wireless tidak ideal.",
    "Router-Firewall": "Jalur kritis harus memakai kabel fisik.",
    "CCTV IP-Switch": "CCTV IP sebaiknya wired (UTP) agar stabil dan aman.",
    "CCTV Analog-DVR/DVR": "CCTV analog tidak support wireless secara native.",
    "DVR/DVR-Monitor": "Koneksi DVR ke Monitor harus kabel video (HDMI/VGA).",
    default: "Wireless cocok untuk end-device (Laptop, Smartphone, beberapa AP mesh), kurang ideal untuk infrastruktur kritis.",
  },

  fiber: {
    "Switch-PC": "PC biasa jarang punya port Fiber (SFP).",
    "Switch-Printer/FC": "Printer umumnya hanya UTP.",
    "Switch-CCTV IP": "Kebanyakan CCTV IP hanya UTP. Hanya model industrial/jarak jauh yang support Fiber.",
    "Switch-CCTV Analog": "CCTV Analog tidak support Fiber.",
    "Access Point-PC": "Access Point ke PC biasanya Wireless atau UTP.",
    "Router-PC": "PC jarang punya port SFP.",
    "DVR/DVR-Monitor": "Monitor tidak punya port Fiber.",
    "Mouse-PC": "Mouse tidak menggunakan Fiber.",
    "Keyboard-PC": "Keyboard tidak menggunakan Fiber.",
    default: "Fiber Optic bagus untuk jarak jauh & bandwidth tinggi, tetapi tidak semua perangkat memiliki port SFP/SFP+.",
  },

  utp: {
    "CCTV Analog-DVR/DVR": "CCTV Analog menggunakan RG59/BNC, bukan UTP.",
    "CCTV Analog-Power Supply DVR": "Power Supply DVR ke kamera analog biasanya kabel power khusus, bukan UTP.",
    "Monitor-PC": "Monitor ke PC memakai HDMI/VGA, bukan UTP.",
    "Mouse-PC": "Mouse menggunakan USB, bukan UTP.",
    "Keyboard-PC": "Keyboard menggunakan USB, bukan UTP.",
    "DVR/DVR-Monitor": "DVR ke Monitor memakai HDMI/VGA.",
    default: null,
  },
};

// Fungsi getReason dan validateConnection tetap sama seperti sebelumnya
function getReason(sourceType, targetType, cableType) {
  const reasonGroup = REASON_MAP[cableType];
  if (!reasonGroup) {
    return `Kabel ${cableType.toUpperCase()} tidak umum digunakan untuk koneksi ${sourceType} ↔ ${targetType}.`;
  }

  const key1 = `${sourceType}-${targetType}`;
  const key2 = `${targetType}-${sourceType}`;

  return (
    reasonGroup[key1] ||
    reasonGroup[key2] ||
    reasonGroup.default ||
    `Kabel ${cableType.toUpperCase()} tidak direkomendasikan untuk ${sourceType} ↔ ${targetType}.`
  );
}

export function validateConnection(sourceType, targetType, cableType) {
  if (!sourceType || !targetType || !cableType) {
    return { valid: true, message: null };
  }

  const key1 = `${sourceType}-${targetType}`;
  const key2 = `${targetType}-${sourceType}`;
  const allowed = CABLE_RULES[key1] || CABLE_RULES[key2];

  if (!allowed) {
    return { valid: true, message: null }; // fleksibel jika belum ada rule
  }

  // Khusus: jika allowed = [] berarti benar-benar dilarang
  if (allowed.length === 0) {
    const reason = getReason(sourceType, targetType, cableType);
    return {
      valid: false,
      message: `${sourceType} ↔ ${targetType} TIDAK BOLEH dihubungkan dengan kabel apapun yang dipilih.\n\nAlasan: ${reason}`,
      allowed: [],
      reason,
    };
  }

  const isValid = allowed.includes(cableType);

  if (isValid) {
    return { valid: true, message: null, allowed };
  }

  const recommended = allowed.map((c) => c.toUpperCase()).join(" / ");
  const reason = getReason(sourceType, targetType, cableType);

  const message = `${sourceType} ↔ ${targetType} tidak disarankan memakai ${cableType.toUpperCase()}.\n\nAlasan: ${reason}\n\nDisarankan: ${recommended}`;

  return {
    valid: false,
    message,
    allowed,
    reason,
  };
}