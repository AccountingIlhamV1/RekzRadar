// Modul berita: hanya MEMBACA fitur/berita/data.json lalu menampilkannya.
// Tidak memanggil situs luar sama sekali (data diisi oleh GitHub Actions).
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var st = $("berita-status"), ul = $("peristiwa-list"), gb = $("ganti-berita"), idx = 0, data = null;
  if (!st || !ul) return;

  function dot(teks, cls) { var d = $("dot-berita-ekonomi"); if (d) { d.textContent = teks; d.className = "dot" + (cls ? " " + cls : ""); } }
  function umur(iso) {
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (isNaN(m)) return "waktu tidak diketahui";
    return m < 1 ? "baru saja" : m < 60 ? m + " menit lalu" : m < 2880 ? Math.round(m / 60) + " jam lalu" : Math.round(m / 1440) + " hari lalu";
  }
  function tampil() {
    ul.textContent = "";
    var ss = data && data.sumber;
    if (!ss || !ss.length) {
      st.textContent = "Belum ada data berita. Jalankan pengambil otomatis dari tab Actions di GitHub.";
      dot("Belum ada data", ""); if (gb) gb.textContent = "Sumber: —"; return;
    }
    idx = idx % ss.length;
    var s = ss[idx];
    if (gb) gb.textContent = "Sumber: " + s.nama;
    (s.berita || []).slice(0, 12).forEach(function (b) {
      if (!/^https?:\/\//i.test(String(b.tautan))) return;
      var li = el("li");
      var w = b.waktu ? new Date(b.waktu).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "waktu tidak diketahui";
      li.appendChild(el("div", "d", w + " · " + String(b.situs || "")));
      var a = el("a", null, String(b.judul || "")); a.href = b.tautan; a.target = "_blank"; a.rel = "noopener noreferrer";
      var d = el("div"); d.appendChild(a); li.appendChild(d); ul.appendChild(li);
    });
    var tua = (Date.now() - Date.parse(data.diperbarui)) > 6 * 3600e3;
    if (s.status === "ok") {
      st.textContent = "Berita " + s.nama + ", disimpan " + umur(data.diperbarui) + "." + (tua ? " Data sudah lama; pengambil otomatis mungkin berhenti." : "");
      dot(tua ? "Data lama" : "Terhubung", tua ? "dn" : "up");
    } else {
      st.textContent = "Pengambilan terakhir gagal: " + s.pesan + "." + ((s.berita || []).length ? " Menampilkan berita tersimpan (" + umur(s.diambil) + ")." : " Tidak ada berita tersimpan.");
      dot("Gagal", "dn");
    }
  }
  function muat() {
    st.textContent = "Memuat…"; dot("Memuat…", "");
    fetch("fitur/berita/data.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (j) { data = j; tampil(); }).catch(function (e) {
      st.textContent = "Gagal membaca data berita: " + e.message + ".";
      dot("Gagal", "dn");
    });
  }
  var mb = $("muat-berita"); if (mb) mb.addEventListener("click", muat);
  if (gb) gb.addEventListener("click", function () { if (data && data.sumber && data.sumber.length) { idx = (idx + 1) % data.sumber.length; tampil(); } });
  muat();
})();
