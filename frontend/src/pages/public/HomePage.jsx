import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// ── Data ─────────────────────────────────────────────────────
const PROGRAMS = [
  {
    kode: "A",
    title: "Kesetaraan Paket A",
    setara: "Setara SD / MI",
    img: "/images/kelas1.jpg",
    warna: "#243B53",
    desc: "Program kesetaraan pendidikan dasar untuk warga belajar yang ingin menuntaskan pendidikan setingkat Sekolah Dasar. Ijazah diakui resmi oleh negara.",
  },
  {
    kode: "B",
    title: "Kesetaraan Paket B",
    setara: "Setara SMP / MTs",
    img: "/images/kelas2.jpg",
    warna: "#1a8fd1",
    desc: "Program kesetaraan untuk warga belajar yang ingin menyelesaikan pendidikan setingkat Sekolah Menengah Pertama dengan jadwal fleksibel.",
  },
  {
    kode: "C",
    title: "Kesetaraan Paket C",
    setara: "Setara SMA / MA",
    img: "/images/rapat1.jpg",
    warna: "#243B53",
    desc: "Program unggulan kami. Ijazah Paket C memiliki hak eligibilitas yang sama dengan lulusan SMA/SMK — termasuk untuk masuk PTN.",
  },
];

const GALERI = [
  { src: "/images/gedung.jpg", label: "Gedung PKBM Bina Mandiri" },
  { src: "/images/kelas1.jpg", label: "Kegiatan Belajar Mengajar" },
  { src: "/images/kelas2.jpg", label: "Suasana Kelas" },
  { src: "/images/rapat1.jpg", label: "Kegiatan Rapat" },
  { src: "/images/rapat2.jpg", label: "Pertemuan Warga Belajar" },
  { src: "/images/rapot.jpg", label: "Pembagian Rapot" },
];

const KEUNGGULAN = [
  { icon: "✦", title: "Ijazah Resmi Kemendikbud", desc: "Dikeluarkan langsung oleh Kementerian Pendidikan, berlaku untuk kerja & PTN." },
  { icon: "✦", title: "Bebas Usia & Domisili", desc: "Terbuka untuk semua usia dari seluruh Indonesia. Daftar online, tanpa tatap muka." },
  { icon: "✦", title: "Jadwal Fleksibel", desc: "Dirancang untuk pekerja & ibu rumah tangga. Belajar kapan saja, di mana saja." },
  { icon: "✦", title: "Di Bawah Dinas Pendidikan", desc: "Diakui dan dinaungi Dinas Pendidikan Kabupaten Sumedang, Jawa Barat." },
  { icon: "✦", title: "Platform Digital Terintegrasi", desc: "LMS lengkap: materi, tugas, absensi, ujian online — semua dalam satu sistem." },
  { icon: "✦", title: "Klub & Bahasa Asing", desc: "Program tambahan: Klub Minat Bakat & Pelatihan Bahasa Inggris, Jepang, Mandarin." },
];

const FAQS = [
  { q: "Apakah ijazah yang didapat resmi dan diakui negara?", a: "Ya. Ijazah Kesetaraan dikeluarkan langsung oleh Kemendikbud dan memiliki hak eligibilitas yang sama dengan ijazah formal — berlaku untuk melamar kerja, masuk PTN, dan keperluan lainnya." },
  { q: "Apakah ada batasan usia untuk mendaftar?", a: "Tidak ada sama sekali. PKBM Bina Mandiri menerima warga belajar dari semua usia — anak-anak, remaja, dewasa, hingga lansia yang ingin menuntaskan pendidikan." },
  { q: "Saya dari luar Sumedang, bisa mendaftar?", a: "Bisa. Pendaftaran dan pembelajaran dapat dilakukan sepenuhnya secara online. Kami menerima warga belajar dari seluruh Indonesia." },
  { q: "Apakah lulusan Paket C bisa masuk PTN?", a: "Ya. Ijazah Paket C setara dengan ijazah SMA/SMK dan dapat digunakan untuk mendaftar ke Perguruan Tinggi Negeri melalui jalur SNBP, SNBT, maupun mandiri." },
  { q: "Apa itu Klub Minat Bakat dan Kelas Bahasa Asing?", a: "Program tambahan di luar KBM reguler. Klub Minat Bakat membantu pengembangan potensi berdasarkan asesmen. Kelas Bahasa Asing tersedia untuk Bahasa Inggris, Jepang, dan Mandarin." },
];

const G = "#5CB8FF";     // Sky Blue primary
const GM = "#1a8fd1";    // Sky Blue darker
const GL = "#FFF8EE";    // Soft Cream background
const NAVY = "#243B53";  // Dark Navy text/dark
const GOLD = "#F9C846";         // Yellow/Gold (untuk highlight special)

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGaleri, setActiveGaleri] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto galeri
  useEffect(() => {
    const t = setInterval(() => setActiveGaleri(p => (p + 1) % GALERI.length), 3500);
    return () => clearInterval(t);
  }, []);

  const navScrolled = scrollY > 80;

  return (
    <div style={{ fontFamily: "'Source Sans Pro', -apple-system, sans-serif", background: "#FAFCFF", color: "#243B53", overflowX: "hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;500;600;700;800;900&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }

        .anim-up   { animation: fadeUp  0.7s ease both; }
        .anim-in   { animation: slideIn 0.6s ease both; }
        .anim-sc   { animation: scaleIn 0.5s ease both; }

        .nav-a {
          text-decoration: none; font-weight: 600; font-size: 0.9rem;
          padding: 4px 0; border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
          text-shadow: 0 1px 4px rgba(0,0,0,0.45);
        }
        .nav-a:hover { border-bottom-color: currentColor; }
        .nav-a-scrolled { text-shadow: none !important; }

        .btn-solid {
          display: inline-block; text-decoration: none;
          background: ${G}; color: #fff;
          padding: 13px 28px; border-radius: 4px;
          font-weight: 700; font-size: 0.92rem; letter-spacing: 0.3px;
          border: 2px solid ${G};
          transition: background 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .btn-solid:hover { background: #1a8fd1; transform: translateY(-2px); }

        .btn-ghost {
          display: inline-block; text-decoration: none;
          background: transparent; color: #fff;
          padding: 13px 28px; border-radius: 4px;
          font-weight: 600; font-size: 0.92rem;
          border: 2px solid rgba(255,255,255,0.55);
          transition: background 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); border-color: #fff; }

        .prog-card {
          border-radius: 12px; overflow: hidden;
          box-shadow: 0 2px 16px rgba(26,143,209,0.10);
          transition: transform 0.25s, box-shadow 0.25s;
          background: #fff;
        }
        .prog-card:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(26,143,209,0.18); }

        .keung-item {
          padding: 28px 24px; border-left: 3px solid ${GL};
          transition: border-color 0.2s, background 0.2s;
          border-radius: 0 8px 8px 0;
        }
        .keung-item:hover { border-left-color: ${GM}; background: ${GL}; }

        .faq-btn {
          width: 100%; background: none; border: none; text-align: left;
          padding: 20px 0; cursor: pointer;
          font-family: 'Source Sans Pro', -apple-system, sans-serif;
          font-size: 0.97rem; font-weight: 600; color: #1a1a1a;
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
        }
        .faq-btn:hover { color: ${G}; }

        .inp {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #c5e0ff; border-radius: 6px;
          font-family: 'Source Sans Pro', -apple-system, sans-serif;
          font-size: 0.93rem; outline: none;
          transition: border-color 0.2s;
          background: #fff;
        }
        .inp:focus { border-color: ${G}; }

        @media (max-width: 768px) {
          .desk-nav { display: none !important; }
          .mob-btn  { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-img-side { display: none !important; }
          .two-col  { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .three-col { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
        background: navScrolled ? "rgba(255,255,255,0.97)" : "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)",
        borderBottom: navScrolled ? `1px solid ${GL}` : "none",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        transition: "background 0.35s, border 0.35s",
        padding: "0 clamp(16px, 4vw, 48px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/images/logo_pkbm.jpg" alt="Logo PKBM" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${navScrolled ? GL : "rgba(255,255,255,0.4)"}` }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: navScrolled ? G : "#fff", lineHeight: 1.15, transition: "color 0.3s", textShadow: navScrolled ? "none" : "0 1px 4px rgba(0,0,0,0.5)" }}>PKBM Bina Mandiri</div>
              <div style={{ fontSize: "0.67rem", color: navScrolled ? "#888" : "rgba(255,255,255,0.9)", transition: "color 0.3s", textShadow: navScrolled ? "none" : "0 1px 3px rgba(0,0,0,0.5)" }}>Kab. Sumedang · Jawa Barat</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="desk-nav" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["#profil","Profil"],["#program","Program"],["#keunggulan","Keunggulan"],["#galeri","Galeri"],["#faq","FAQ"],["#kontak","Kontak"]].map(([h,l]) => (
              <a key={l} href={h} className={`nav-a${navScrolled ? " nav-a-scrolled" : ""}`} style={{ color: navScrolled ? "#333" : "#fff" }}>{l}</a>
            ))}
            <div style={{ width: 1, height: 20, background: navScrolled ? "#ddd" : "rgba(255,255,255,0.3)" }} />
            <Link to="/login" className="nav-a" style={{ color: navScrolled ? G : "rgba(255,255,255,0.9)" }}>Masuk</Link>
            <Link to="/daftar" className="btn-solid" style={{ padding: "9px 20px", fontSize: "0.86rem", background: navScrolled ? G : "#fff", color: navScrolled ? "#fff" : G, borderColor: navScrolled ? G : "#fff" }}>Daftar</Link>
          </nav>

          {/* Mobile btn */}
          <button className="mob-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", flexDirection: "column", gap: 5, padding: 4 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width: 24, height: 2, background: navScrolled ? G : "#fff", borderRadius: 2, display: "block", transition: "all 0.3s" }} />
            ))}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "#fff", borderTop: `3px solid ${G}`, padding: "20px clamp(16px,4vw,48px)" }}>
            {[["#profil","Profil"],["#program","Program"],["#keunggulan","Keunggulan"],["#galeri","Galeri"],["#faq","FAQ"],["#kontak","Kontak"]].map(([h,l]) => (
              <a key={l} href={h} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 0", borderBottom: `1px solid ${GL}`, color: G, textDecoration: "none", fontWeight: 500 }}>{l}</a>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center", padding: 11, border: `2px solid ${G}`, borderRadius: 4, color: G, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>Masuk</Link>
              <Link to="/daftar" onClick={() => setMenuOpen(false)} className="btn-solid" style={{ flex: 1, textAlign: "center" }}>Daftar</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", overflow: "hidden" }} className="hero-grid">

        {/* Kiri — Foto gedung */}
        <div className="hero-img-side" style={{ position: "relative", overflow: "hidden" }}>
          <img src="/images/gedung.jpg" alt="Gedung PKBM Bina Mandiri"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center",
              transform: `scale(1.05) translateY(${scrollY * 0.03}px)`, transition: "transform 0.1s linear" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, #FAFCFF 100%)" }} />
          {/* Watermark label */}
          <div style={{ position: "absolute", bottom: 32, left: 28, background: "rgba(26,143,209,0.85)", backdropFilter: "blur(8px)", color: "#fff", padding: "10px 18px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 600 }}>
            📍 Kab. Sumedang, Jawa Barat
          </div>
        </div>

        {/* Kanan — Teks */}
        <div style={{
          background: `linear-gradient(160deg, #1a8fd1 0%, #243B53 100%)`,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "120px clamp(28px,5vw,72px) 60px",
          position: "relative",
        }}>
          {/* Aksen garis emas */}
          <div style={{ width: 48, height: 4, background: GOLD, borderRadius: 2, marginBottom: 28 }} className="anim-in" />

          <div className="anim-up" style={{ animationDelay: "0.1s" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,168,75,0.18)", border: `1px solid rgba(200,168,75,0.4)`, borderRadius: 20, padding: "5px 14px", marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, background: GOLD, borderRadius: "50%", display: "inline-block" }} />
              <span style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 700, letterSpacing: 1 }}>RESMI · TERAKREDITASI</span>
            </div>

            <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.12, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Pendidikan
            </h1>
            <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.12, marginBottom: 8, letterSpacing: "-0.5px" }}>
              <span style={{ color: GOLD }}>Setara,</span>
            </h1>
            <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.12, marginBottom: 28, letterSpacing: "-0.5px" }}>
              Masa Depan<br />Gemilang.
            </h1>

            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "1rem", lineHeight: 1.8, marginBottom: 36, maxWidth: 420 }}>
              Penyelenggara resmi Program Kesetaraan <strong style={{ color: "#fff" }}>Paket A, B, dan C</strong> di bawah naungan Dinas Pendidikan Kabupaten Sumedang. Terbuka untuk semua usia, seluruh Indonesia.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/daftar" className="btn-solid" style={{ background: GOLD, borderColor: GOLD, color: "#243B53" }}>Daftar Sekarang</Link>
              <a href="#program" className="btn-ghost">Lihat Program</a>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 0, marginTop: 52, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 28 }}>
              {[["3","Program Kesetaraan"],["Semua","Usia Diterima"],["100%","Ijazah Resmi"]].map(([n,l], i) => (
                <div key={l} style={{ flex: 1, paddingRight: i < 2 ? 24 : 0, borderRight: i < 2 ? "1px solid rgba(255,255,255,0.12)" : "none", paddingLeft: i > 0 ? 24 : 0 }}>
                  <div style={{ fontSize: "1.7rem", fontWeight: 900, color: GOLD }}>{n}</div>
                  <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", marginTop: 4, lineHeight: 1.4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dekorasi lingkaran */}
          <div style={{ position: "absolute", bottom: -60, right: -60, width: 220, height: 220, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -100, right: -100, width: 340, height: 340, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)" }} />
        </div>
      </section>

      {/* ══ PROFIL ══════════════════════════════════════════════ */}
      <section id="profil" style={{ padding: "96px clamp(16px,4vw,48px)", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 14, marginBottom: 36, alignItems: "center" }}>
                <img src="/images/logo_pkbm.jpg" alt="Logo PKBM" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${GL}` }} />
                <img src="/images/logo_yayasan.jpg" alt="Logo Yayasan" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${GL}` }} />
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 12, textTransform: "uppercase" }}>Tentang Lembaga</div>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: "#243B53" }}>
                PKBM Bina Mandiri
              </h2>
              <div style={{ width: 40, height: 3, background: GOLD, marginBottom: 24, borderRadius: 2 }} />
              <p style={{ color: "#555", lineHeight: 1.85, marginBottom: 14, fontSize: "0.96rem" }}>
                <strong style={{ color: G }}>PKBM Bina Mandiri</strong> adalah lembaga pendidikan nonformal resmi di bawah naungan <strong>Yayasan Amal Bina Insani Darulhuda</strong> dan Dinas Pendidikan Kabupaten Sumedang, Jawa Barat.
              </p>
              <p style={{ color: "#555", lineHeight: 1.85, marginBottom: 24, fontSize: "0.96rem" }}>
                Kami menyelenggarakan Program Kesetaraan Paket A, B, dan C dengan sistem pembelajaran digital yang inklusif — dirancang khusus untuk warga belajar dari semua usia dan latar belakang.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Resmi Kemendikbud","Naungan Dinas Pendidikan","Bebas Usia","Bebas Domisili","Platform Digital"].map(t => (
                  <span key={t} style={{ padding: "6px 14px", background: GL, color: G, borderRadius: 4, fontSize: "0.8rem", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Brosur / Foto */}
            <div style={{ position: "relative" }}>
              <img src="/images/brosur.jpg" alt="Brosur PKBM" style={{ width: "100%", borderRadius: 16, objectFit: "cover", boxShadow: `0 24px 64px rgba(26,143,209,0.18)` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROGRAM ═════════════════════════════════════════════ */}
      <section id="program" style={{ padding: "96px clamp(16px,4vw,48px)", background: GL }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 10, textTransform: "uppercase" }}>Program Kami</div>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#243B53", lineHeight: 1.2 }}>Pendidikan Kesetaraan</h2>
            </div>
            <Link to="/daftar" className="btn-solid" style={{ fontSize: "0.86rem", padding: "11px 22px" }}>Daftar Program</Link>
          </div>

          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {PROGRAMS.map((p, i) => (
              <div key={i} className="prog-card">
                {/* Foto */}
                <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                    onMouseOver={e => e.currentTarget.style.transform = "scale(1.06)"}
                    onMouseOut={e => e.currentTarget.style.transform = "scale(1)"} />
                  <div style={{ position: "absolute", top: 14, left: 14, background: p.warna, color: "#fff", padding: "5px 14px", borderRadius: 4, fontSize: "0.8rem", fontWeight: 800, letterSpacing: 0.5 }}>
                    PAKET {p.kode}
                  </div>
                </div>
                {/* Konten */}
                <div style={{ padding: "24px 24px 28px" }}>
                  <div style={{ fontSize: "0.75rem", color: GM, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>{p.setara}</div>
                  <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 12, color: "#243B53" }}>{p.title}</h3>
                  <p style={{ color: "#666", fontSize: "0.88rem", lineHeight: 1.72, marginBottom: 20 }}>{p.desc}</p>
                  <Link to="/daftar" style={{ color: G, fontWeight: 700, fontSize: "0.87rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Syarat Pendaftaran <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Program tambahan */}
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="two-col">
            {[
              { emoji: "🎯", judul: "Klub Minat Bakat", sub: "Lintas jenjang Paket A/B/C", desc: "Pengembangan bakat berdasarkan hasil asesmen psikometri. Bergabung dengan komunitas belajar sesuai minatmu." },
              { emoji: "🌐", judul: "Pelatihan Bahasa Asing", sub: "Inggris · Jepang · Mandarin", desc: "Program bertingkat dengan materi terstruktur dan proyek kolaboratif. Buka peluang karier internasional." },
            ].map((x, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "28px 28px", display: "flex", gap: 20, alignItems: "flex-start", border: `1px solid #c5e4ff` }}>
                <div style={{ fontSize: "2.2rem", flexShrink: 0 }}>{x.emoji}</div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: GM, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{x.sub}</div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 8, color: "#243B53" }}>{x.judul}</h4>
                  <p style={{ color: "#666", fontSize: "0.87rem", lineHeight: 1.7 }}>{x.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ KEUNGGULAN ══════════════════════════════════════════ */}
      <section id="keunggulan" style={{ padding: "96px clamp(16px,4vw,48px)", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 72, alignItems: "start" }}>
            <div style={{ position: "sticky", top: 96 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 10, textTransform: "uppercase" }}>Keunggulan</div>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: "#243B53" }}>Kenapa Pilih<br />PKBM Bina<br />Mandiri?</h2>
              <div style={{ width: 40, height: 3, background: GOLD, borderRadius: 2, marginBottom: 24 }} />
              <p style={{ color: "#666", lineHeight: 1.8, fontSize: "0.93rem", marginBottom: 28 }}>
                Lebih dari sekadar lembaga kejar paket — kami adalah ekosistem pendidikan digital yang dirancang untuk semua kalangan.
              </p>
              <img src="/images/kelas2.jpg" alt="Suasana belajar" style={{ width: "100%", borderRadius: 12, objectFit: "cover", maxHeight: 220 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {KEUNGGULAN.map((k, i) => (
                <div key={i} className="keung-item">
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ color: GOLD, fontSize: "1rem", flexShrink: 0, marginTop: 2 }}>{k.icon}</span>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: "0.97rem", marginBottom: 6, color: "#243B53" }}>{k.title}</h4>
                      <p style={{ color: "#666", fontSize: "0.88rem", lineHeight: 1.7 }}>{k.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section style={{ background: `linear-gradient(135deg, #1a8fd1 0%, #243B53 100%)`, padding: "72px clamp(16px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ width: 40, height: 3, background: GOLD, margin: "0 auto 24px", borderRadius: 2 }} />
          <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.8rem)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.2 }}>
            Pendaftaran Warga Belajar<br /><span style={{ color: GOLD }}>Baru Dibuka!</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.78)", marginBottom: 36, fontSize: "1rem", lineHeight: 1.8 }}>
            Paket A · Paket B · Paket C — Terbuka untuk semua usia dari seluruh Indonesia.<br />Daftar online sekarang, proses cepat tanpa harus hadir langsung.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/daftar" className="btn-solid" style={{ background: GOLD, borderColor: GOLD, color: "#243B53", fontWeight: 800 }}>Daftar Sekarang</Link>
            <a href="#kontak" className="btn-ghost">Tanya Lebih Lanjut</a>
          </div>
        </div>
        <div style={{ position: "absolute", right: -80, top: -80, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", left: -60, bottom: -60, width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)" }} />
      </section>

      {/* ══ GALERI ══════════════════════════════════════════════ */}
      <section id="galeri" style={{ padding: "96px clamp(16px,4vw,48px)", background: GL }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 10, textTransform: "uppercase" }}>Dokumentasi</div>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#243B53" }}>Galeri Kegiatan</h2>
          </div>

          {/* Featured */}
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, height: 380, position: "relative", boxShadow: `0 16px 48px rgba(26,143,209,0.15)` }}>
            <img src={GALERI[activeGaleri].src} alt={GALERI[activeGaleri].label}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.4s" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "32px 24px 20px" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{GALERI[activeGaleri].label}</span>
            </div>
          </div>

          {/* Thumbnails */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {GALERI.map((g, i) => (
              <div key={i} onClick={() => setActiveGaleri(i)} style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", height: 80, border: `2px solid ${i === activeGaleri ? G : "transparent"}`, transition: "border-color 0.2s", opacity: i === activeGaleri ? 1 : 0.65 }}>
                <img src={g.src} alt={g.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: "96px clamp(16px,4vw,48px)", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 10, textTransform: "uppercase" }}>Tanya Jawab</div>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, color: "#243B53" }}>Pertanyaan Umum</h2>
          </div>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${GL}` }}>
              <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <span style={{ fontSize: "1.3rem", color: G, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s", display: "inline-block", minWidth: 22, textAlign: "center", flexShrink: 0 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: 20, color: "#555", lineHeight: 1.82, fontSize: "0.93rem" }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ KONTAK ══════════════════════════════════════════════ */}
      <section id="kontak" style={{ padding: "96px clamp(16px,4vw,48px)", background: GL }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 10, textTransform: "uppercase" }}>Hubungi Kami</div>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, color: "#243B53", marginBottom: 16, lineHeight: 1.2 }}>Ada Pertanyaan?</h2>
              <div style={{ width: 36, height: 3, background: GOLD, marginBottom: 24, borderRadius: 2 }} />
              <p style={{ color: "#666", lineHeight: 1.82, marginBottom: 32, fontSize: "0.94rem" }}>
                Tim kami siap membantu menemukan program yang tepat dan menjelaskan proses pendaftaran secara detail.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  ["📍","Alamat","Kabupaten Sumedang, Jawa Barat"],
                  ["🏛️","Naungan","Yayasan Amal Bina Insani Darulhuda"],
                  ["📧","Email","info@pkbm-binamandiri.id"],
                  ["🕐","Jam Layanan","Senin–Jumat, 08.00–16.00 WIB"],
                ].map(([icon,label,val]) => (
                  <div key={label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0, border: `1px solid #c5e4ff` }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: "0.76rem", color: "#999", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                      <div style={{ color: "#243B53", fontWeight: 500, fontSize: "0.92rem" }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Foto rapat */}
              <img src="/images/rapat2.jpg" alt="Tim PKBM" style={{ width: "100%", borderRadius: 12, marginTop: 32, objectFit: "cover", maxHeight: 180 }} />
            </div>

            {/* Form */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: `0 8px 32px rgba(26,143,209,0.08)`, border: `1px solid #c5e4ff` }}>
              <h3 style={{ fontWeight: 800, fontSize: "1.15rem", marginBottom: 6, color: G }}>Kirim Pesan</h3>
              <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: 24 }}>Kami balas dalam 1×24 jam kerja.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input className="inp" placeholder="Nama Lengkap" />
                <input className="inp" placeholder="No HP / WhatsApp" />
                <input className="inp" placeholder="Email (opsional)" />
                <select className="inp" style={{ color: "#555" }}>
                  <option value="">Pilih Program yang Diminati</option>
                  <option>Paket A (Setara SD)</option>
                  <option>Paket B (Setara SMP)</option>
                  <option>Paket C (Setara SMA)</option>
                  <option>Klub Minat Bakat</option>
                  <option>Pelatihan Bahasa Asing</option>
                  <option>Informasi Umum</option>
                </select>
                <textarea className="inp" placeholder="Tulis pesan atau pertanyaan kamu..." rows={4} style={{ resize: "vertical" }} />
                <button className="btn-solid" style={{ width: "100%", padding: 13, textAlign: "center" }}>Kirim Pesan</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ LOKASI / MAPS ═══════════════════════════════════════ */}
      <section style={{ padding: "0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px clamp(16px,4vw,48px) 0" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2, color: GM, marginBottom: 10, textTransform: "uppercase" }}>Lokasi Kami</div>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#243B53" }}>Temukan PKBM Bina Mandiri</h2>
            <p style={{ color: "#666", marginTop: 10, fontSize: "0.93rem" }}>Kabupaten Sumedang, Jawa Barat</p>
          </div>
        </div>

        {/* Maps embed full width */}
        <div style={{ position: "relative", width: "100%", height: 420 }}>
          <iframe
            title="Lokasi PKBM Bina Mandiri"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.3942944168!2d107.8623!3d-6.8549!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e1e3c4a3c1b1%3A0x1234567890abcdef!2sPKBM%20Bina%20Mandiri!5e0!3m2!1sid!2sid!4v1234567890"
            width="100%"
            height="420"
            style={{ border: 0, display: "block", filter: "saturate(0.85)" }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Info card di atas maps */}
          <div style={{
            position: "absolute", top: 20, right: "clamp(16px,4vw,48px)",
            background: "#fff", borderRadius: 12, padding: "18px 22px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            maxWidth: 280, zIndex: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img src="/images/logo_pkbm.jpg" alt="Logo" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: G }}>PKBM Bina Mandiri</div>
                <div style={{ fontSize: "0.7rem", color: "#888" }}>Pendidikan Kesetaraan</div>
              </div>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
              📍 Kabupaten Sumedang,<br />Jawa Barat
            </div>
            <div style={{ fontSize: "0.78rem", color: "#666", marginBottom: 4 }}>
              🕐 Senin–Jumat, 08.00–16.00 WIB
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: "#243B53", color: "rgba(255,255,255,0.7)", padding: "56px clamp(16px,4vw,48px) 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <img src="/images/logo_pkbm.jpg" alt="Logo" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }} />
                <div>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.93rem" }}>PKBM Bina Mandiri</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.6 }}>Kab. Sumedang, Jawa Barat</div>
                </div>
              </div>
              <p style={{ fontSize: "0.87rem", lineHeight: 1.8, maxWidth: 280 }}>
                Penyelenggara Resmi Program Pendidikan Kesetaraan Paket A, B, dan C. Naungan Yayasan Amal Bina Insani Darulhuda & Dinas Pendidikan Kab. Sumedang.
              </p>
              <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(255,255,255,0.08)", borderRadius: 6, display: "inline-block" }}>
                <div style={{ fontSize: "0.7rem", color: GOLD, fontWeight: 700, marginBottom: 2 }}>YAYASAN</div>
                <div style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>Amal Bina Insani Darulhuda</div>
              </div>
            </div>

            {[
              ["Program",["Kesetaraan Paket A","Kesetaraan Paket B","Kesetaraan Paket C","Klub Minat Bakat","Bahasa Asing"]],
              ["Navigasi",["Beranda","Profil","Keunggulan","Galeri","FAQ","Kontak"]],
              ["Akun",["Masuk / Login","Daftar Siswa Baru","Lupa Password"]],
            ].map(([title, items]) => (
              <div key={title}>
                <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>{title}</h4>
                {items.map(item => (
                  <a key={item} href="#" style={{ display: "block", color: "rgba(255,255,255,0.58)", textDecoration: "none", fontSize: "0.85rem", marginBottom: 9, transition: "color 0.2s" }}
                    onMouseOver={e => e.target.style.color = GOLD}
                    onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.58)"}>{item}</a>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: "0.8rem" }}>
            <span>© 2025 PKBM Bina Mandiri · Yayasan Amal Bina Insani Darulhuda</span>
            <span>Naungan Dinas Pendidikan Kabupaten Sumedang</span>
          </div>
        </div>
      </footer>
    </div>
  );
}