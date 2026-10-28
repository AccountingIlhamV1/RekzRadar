// Pengambil berita: dijalankan otomatis oleh GitHub Actions (bukan di browser).
// Hasilnya disimpan ke fitur/berita/data.json, lalu dibaca halaman web.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const FILE = "fitur/berita/data.json";
const SUMBER = [
  { id: "pasar", nama: "Pasar (Indonesia)", bahasa: "id", situs: "Investortrust", url: "https://investortrust.id/rss/market.rss" },
  { id: "makro", nama: "Makro (Indonesia)", bahasa: "id", situs: "Investortrust", url: "https://investortrust.id/rss/macro.rss" },
  { id: "bbc", nama: "Bisnis (BBC, Inggris)", bahasa: "en", situs: "BBC News", url: "https://feeds.bbci.co.uk/news/business/rss.xml" }
];
const MAKS = 15;
const DENYUT_MS = 3 * 3600e3; // tulis ulang minimal tiap 3 jam walau isi sama

function bersih(s) {
  let t = String(s || "").trim();
  const m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(t);
  if (m) t = m[1];
  return t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
function tag(xml, nama) {
  const m = new RegExp("<" + nama + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + nama + ">", "i").exec(xml);
  return m ? m[1] : "";
}
export function parseRss(xml, situs) {
  const out = [], seen = new Set();
  for (const blok of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []) {
    const judul = bersih(tag(blok, "title")).slice(0, 200);
    const tautan = bersih(tag(blok, "link"));
    if (!judul || !/^https?:\/\//i.test(tautan)) continue;
    const k = judul.toLowerCase().slice(0, 80);
    if (seen.has(k)) continue;
    seen.add(k);
    const d = new Date(bersih(tag(blok, "pubDate")));
    out.push({ judul, tautan, waktu: isNaN(d) ? null : d.toISOString(), situs });
    if (out.length >= MAKS) break;
  }
  return out;
}

async function utama() {
  let lama = null;
  try { lama = JSON.parse(readFileSync(FILE, "utf8")); } catch {}
  const sekarang = new Date().toISOString();
  const sumber = [];
  for (const s of SUMBER) {
    const dulu = lama && Array.isArray(lama.sumber) ? lama.sumber.find(x => x.id === s.id) : null;
    try {
      const r = await fetch(s.url, {
        signal: AbortSignal.timeout(20000),
        headers: { "User-Agent": "RekzRadar/1.0", "Accept": "application/rss+xml, application/xml, text/xml, */*" }
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const berita = parseRss(await r.text(), s.situs);
      if (!berita.length) throw new Error("tidak ada item berita yang terbaca");
      sumber.push({ id: s.id, nama: s.nama, bahasa: s.bahasa, status: "ok", pesan: "", diambil: sekarang, berita });
      console.log("OK    ", s.id, berita.length, "berita");
    } catch (e) {
      const pesan = String(e && e.message || e).slice(0, 200);
      sumber.push({ id: s.id, nama: s.nama, bahasa: s.bahasa, status: "gagal", pesan,
        diambil: dulu ? dulu.diambil : null, berita: dulu && Array.isArray(dulu.berita) ? dulu.berita : [] });
      console.log("GAGAL ", s.id, pesan);
    }
  }
  const tanda = x => JSON.stringify(x.map(s => [s.id, s.status, s.pesan, s.berita]));
  const sama = lama && Array.isArray(lama.sumber) && tanda(lama.sumber) === tanda(sumber);
  const tua = !lama || !lama.diperbarui || Date.now() - Date.parse(lama.diperbarui) > DENYUT_MS;
  if (sama && !tua) { console.log("Tidak ada perubahan; file tidak ditulis."); return; }
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify({ diperbarui: sekarang, sumber }, null, 1) + "\n");
  console.log("Ditulis:", FILE);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) utama();
    
