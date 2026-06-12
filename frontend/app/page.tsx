"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Syringe, Stethoscope, Hotel, Scissors,
  Activity, Microscope, MapPin, Phone, Mail, MessageCircle, PawPrint, Menu, X,
} from "lucide-react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tutup menu saat klik link
  const closeMenu = () => setMenuOpen(false);

  // Tutup menu saat klik di luar drawer
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:       #5a9e3a;
          --green-dark:  #3e7a25;
          --green-light: #eaf4e2;
          --white:       #ffffff;
          --bg:          #f8f9f6;
          --text:        #1e2a1a;
          --muted:       #6b7a65;
          --border:      #dde8d5;
          --shadow:      0 2px 16px rgba(0,0,0,0.07);
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Poppins', sans-serif;
          background: var(--bg);
          color: var(--text);
          font-size: 15px;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* ─── NAVBAR ─── */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 64px;
          display: flex; align-items: center;
          padding: 0 2.5rem;
          transition: background 0.35s, box-shadow 0.35s;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-links {
          display: flex; gap: 2rem; list-style: none;
          margin: 0 auto;
        }
        .nav-links a {
          font-size: 0.82rem; font-weight: 500;
          text-decoration: none; opacity: 0.9;
          transition: opacity 0.2s, color 0.2s;
          letter-spacing: 0.03em;
        }
        .nav-links a:hover { opacity: 1; color: var(--green) !important; }
        .nav-actions {
          display: flex; gap: 0.6rem; align-items: center; flex-shrink: 0;
        }
        .btn-register {
          padding: 0.42rem 1.1rem;
          background: var(--green); color: #fff;
          border: none; border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.78rem; font-weight: 600; letter-spacing: 0.05em;
          text-decoration: none; cursor: pointer;
          transition: background 0.2s;
        }
        .btn-register:hover { background: var(--green-dark); }
        .btn-login {
          padding: 0.42rem 1.1rem;
          background: transparent;
          border: 1.5px solid currentColor;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.78rem; font-weight: 600; letter-spacing: 0.05em;
          text-decoration: none; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-login:hover { background: var(--green); color: #fff !important; border-color: var(--green); }

        /* ─── HAMBURGER ─── */
        .hamburger {
          display: none;
          align-items: center; justify-content: center;
          width: 38px; height: 38px;
          background: transparent;
          border: 1.5px solid currentColor;
          border-radius: 8px;
          cursor: pointer;
          margin-left: auto;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .hamburger:hover { background: rgba(255,255,255,0.15); }

        /* ─── MOBILE DRAWER ─── */
        .nav-drawer {
          display: none;
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: var(--white);
          border-bottom: 1px solid var(--border);
          flex-direction: column;
          padding: 1rem 1.5rem 1.5rem;
          gap: 0;
          list-style: none;
          z-index: 199;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .nav-drawer.open { display: flex; }
        .nav-drawer li { border-bottom: 1px solid var(--border); }
        .nav-drawer li:last-child { border-bottom: none; }
        .nav-drawer a {
          display: block;
          padding: 0.85rem 0;
          font-size: 0.9rem; font-weight: 500;
          color: var(--text); text-decoration: none;
          transition: color 0.2s;
        }
        .nav-drawer a:hover { color: var(--green); }
        .nav-drawer .drawer-actions {
          display: flex; gap: 0.6rem; padding-top: 1rem;
        }
        .nav-drawer .drawer-actions a {
          flex: 1; text-align: center;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem; font-weight: 600;
        }
        .nav-drawer .drawer-actions .btn-register { background: var(--green); color: #fff; }
        .nav-drawer .drawer-actions .btn-login {
          border: 1.5px solid var(--border); color: var(--text);
        }

        /* ─── HERO ─── */
        .hero {
          position: relative;
          height: 100vh; min-height: 520px; max-height: 860px;
          display: flex; align-items: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #4a7a30 0%, #2e5c18 100%);
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right,
            rgba(20,40,10,0.62) 0%,
            rgba(20,40,10,0.2) 60%,
            transparent 100%);
        }
        .hero-content {
          position: relative; z-index: 2;
          max-width: 560px; padding: 0 3rem;
        }
        .hero-content h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
          font-weight: 700; line-height: 1.25;
          color: #fff; margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }
        .hero-content p {
          font-size: 0.88rem; font-weight: 300;
          color: rgba(255,255,255,0.85);
          margin-bottom: 2rem; max-width: 400px; line-height: 1.7;
        }
        .btn-book {
          display: inline-block; padding: 0.75rem 2rem;
          background: var(--green); color: #fff;
          border-radius: 8px; font-size: 0.88rem; font-weight: 600;
          text-decoration: none; letter-spacing: 0.04em;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 4px 20px rgba(90,158,58,0.4);
        }
        .btn-book:hover { background: var(--green-dark); transform: translateY(-2px); }

        /* ─── SECTION BASE ─── */
        .section { padding: 5rem 2.5rem; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .section-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 600; color: var(--text); margin-bottom: 0.5rem;
        }
        .section-header p { font-size: 0.88rem; color: var(--muted); max-width: 480px; margin: 0 auto; }

        /* ─── ABOUT ─── */
        .about-section { background: var(--bg); padding: 5rem 2.5rem; }
        .about-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
        }
        .about-image {
          border-radius: 16px; overflow: hidden; aspect-ratio: 4/4;
          display: flex; align-items: center; justify-content: center;
          font-size: 5rem; position: relative;
        }
        .about-text .label {
          font-size: 1rem; font-weight: 600; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--green);
          margin-bottom: 0.75rem; margin-top: 1.5rem; display: block;
        }
        .about-text h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 600; color: var(--text);
          margin-bottom: 1.2rem; line-height: 1.3;
        }
        .about-text p { font-size: 0.88rem; color: var(--muted); line-height: 1.85; margin-bottom: 1rem; }

        /* ─── SERVICES ─── */
        .services-section { background: var(--white); }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .service-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 14px; padding: 1.8rem 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .service-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; background: var(--green);
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
        }
        .service-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
        .service-card:hover::after { transform: scaleX(1); }
        .service-card-icon {
          width: 50px; height: 50px; background: var(--green-light);
          border-radius: 12px; display: flex; align-items: center;
          justify-content: center; margin-bottom: 1rem;
        }
        .service-card h3 { font-size: 0.92rem; font-weight: 600; color: var(--text); margin-bottom: 0.5rem; }
        .service-card p { font-size: 0.8rem; color: var(--muted); line-height: 1.7; margin-bottom: 1rem; }
        .service-link { font-size: 0.75rem; font-weight: 600; color: var(--green); text-decoration: none; }
        .service-link:hover { text-decoration: underline; }

        /* ─── CONTACT ─── */
        .contact-section { background: var(--bg); }
        .contact-info h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.45rem; font-weight: 600; color: var(--text); margin-bottom: 1.5rem;
        }
        .contact-cards {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 0.5rem;
        }
        .contact-card {
          background: var(--white); border-radius: 14px;
          padding: 1.4rem 1.2rem; border: 1px solid var(--border);
          display: flex; gap: 0.75rem; align-items: flex-start;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .contact-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
        .contact-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--green-light);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .contact-card-text strong { display: block; font-size: 0.78rem; font-weight: 600; color: var(--text); margin-bottom: 0.15rem; }
        .contact-card-text span { font-size: 0.78rem; color: var(--muted); }

        /* ─── FOOTER ─── */
        footer { background: #1a2e14; padding: 1.5rem 2rem 0.8rem; }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 1rem; margin-bottom: 1rem;
        }
        .footer-logo-wrap { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .footer-logo-icon {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--green);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .footer-logo-text { font-size: 0.88rem; font-weight: 700; color: #fff; letter-spacing: 0.08em; text-transform: uppercase; }
        .footer-brand p { font-size: 0.78rem; line-height: 1.7; color: rgba(255,255,255,0.5); max-width: 210px; }
        .footer-col h4 {
          font-size: 0.72rem; font-weight: 700; color: #fff;
          letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.6rem;
        }
        .footer-col ul { list-style: none; }
        .footer-col ul li { margin-bottom: 0.25rem; }
        .footer-col ul li a { font-size: 0.78rem; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; }
        .footer-col ul li a:hover { color: #fff; }
        .footer-bottom {
          max-width: 1100px; margin: 0 auto;
          padding-top: 0.2rem; border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 0.5rem;
        }
        .footer-bottom p { font-size: 0.72rem; color: rgba(255,255,255,0.4); }

        /* ─── RESPONSIVE: TABLET (≤900px) ─── */
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr; gap: 2rem; }
          .services-grid { grid-template-columns: 1fr 1fr; }
          .footer-inner { grid-template-columns: 1fr 1fr; gap: 2rem; }
          .contact-cards { grid-template-columns: 1fr; }
        }

        /* ─── RESPONSIVE: MOBILE (≤600px) ─── */
        @media (max-width: 600px) {
          /* Navbar */
          .navbar { padding: 0 1.25rem; }
          .nav-links { display: none; }
          .nav-actions { display: none; }
          .hamburger { display: flex; }

          /* Hero */
          .hero { height: auto; min-height: 480px; max-height: none; padding: 80px 0 3rem; }
          .hero-content { padding: 0 1.5rem; max-width: 100%; }
          .hero-overlay {
            background: linear-gradient(to bottom,
              rgba(20,40,10,0.55) 0%,
              rgba(20,40,10,0.45) 100%);
          }

          /* About */
          .about-section { padding: 3rem 1.25rem; }
          .about-text .label { font-size: 0.75rem; }
          .about-image { aspect-ratio: 16/10; }

          /* Services */
          .section { padding: 3rem 1.25rem; }
          .services-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .service-card { padding: 1.2rem 1rem; }

          /* Contact */
          .contact-cards { grid-template-columns: 1fr; }

          /* Footer */
          .footer-inner { grid-template-columns: 1fr; gap: 1.5rem; }
          footer { padding: 2rem 1.25rem 1rem; }
        }

        /* ─── RESPONSIVE: SMALL MOBILE (≤400px) ─── */
        @media (max-width: 400px) {
          .services-grid { grid-template-columns: 1fr; }
          .hero-content h1 { font-size: 1.5rem; }
          .btn-book { padding: 0.65rem 1.5rem; font-size: 0.82rem; }
          .navbar { padding: 0 1rem; }
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="navbar" style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.12)",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
        backdropFilter: "blur(10px)",
      }}>
        <a href="#home" className="nav-logo">
          <Image
            src="/images/logo1.png"
            alt="Sipeka"
            width={0}
            height={0}
            sizes="180px"
            style={{ width: "150px", height: "auto", borderRadius: "0%" }}
          />
        </a>

        {/* Desktop nav links */}
        <ul className="nav-links">
          {[
            { label: "Beranda", href: "home"    },
            { label: "Tentang", href: "about"   },
            { label: "Layanan", href: "service" },
            { label: "Kontak",  href: "contact" },
          ].map((l) => (
            <li key={l.href}>
              <a href={`#${l.href}`} style={{ color: scrolled ? "#1e2a1a" : "#fff" }}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="nav-actions">
          <Link href="/auth/regis" className="btn-register">Daftar</Link>
          <Link
            href="/auth/login_dokter"
            className="btn-login"
            style={{ color: scrolled ? "#1e2a1a" : "#fff" }}
          >
            Masuk
          </Link>
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Buka menu"
          style={{ color: scrolled ? "#1e2a1a" : "#fff", borderColor: scrolled ? "#1e2a1a" : "#fff" }}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* ─── MOBILE DRAWER ─── */}
      <ul ref={drawerRef} className={`nav-drawer ${menuOpen ? "open" : ""}`}>
        {[
          { label: "Beranda", href: "home"    },
          { label: "Tentang", href: "about"   },
          { label: "Layanan", href: "service" },
          { label: "Kontak",  href: "contact" },
        ].map((l) => (
          <li key={l.href}>
            <a href={`#${l.href}`} onClick={closeMenu}>{l.label}</a>
          </li>
        ))}
        <li className="drawer-actions">
          <Link href="/auth/regis" className="btn-register" onClick={closeMenu}>Daftar</Link>
          <Link href="/auth/login_dokter" className="btn-login" onClick={closeMenu}>Masuk</Link>
        </li>
      </ul>

      {/* ─── HERO ─── */}
      <section className="hero" id="home">
        <div className="hero-bg">
          <Image
            src="/images/home1.png"
            alt="Hero"
            fill
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Perawatan Terbaik<br />untuk Hewan Anda</h1>
          <p>Dari pemesanan hingga perawatan, kelola segalanya dalam satu sistem yang mudah dan terpercaya.</p>
          <a href="#contact" className="btn-book">Buat Janji Sekarang</a>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section className="about-section" id="about">
        <div className="about-grid">
          <div className="about-image" style={{ position: "relative" }}>
            <Image
              src="/images/about1.png"
              alt="Tentang Sipeka"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="about-text">
            <span className="label">Tentang Kami</span>
            <h2>Platform Kesehatan Hewan Terpercaya</h2>
            <p>Sipeka hadir sebagai solusi digital untuk pengelolaan layanan kesehatan hewan di Indonesia. Kami menghubungkan pemilik hewan dengan dokter hewan berpengalaman melalui sistem booking yang mudah dan transparan.</p>
            <p>Dengan rekam medis digital, pengingat jadwal otomatis, dan layanan konsultasi online, Sipeka memastikan hewan peliharaan Anda mendapatkan perawatan terbaik kapan pun dibutuhkan.</p>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="section services-section" id="service">
        <div className="section-inner">
          <div className="section-header">
            <h2>Layanan Kami</h2>
            <p>Perawatan lengkap untuk setiap kebutuhan hewan peliharaan Anda</p>
          </div>
          <div className="services-grid">
            {[
              { icon: <Syringe    size={22} color="var(--green)" />, title: "Vaksinasi",                desc: "Layanan vaksinasi untuk anjing dan kucing dengan berbagai jenis vaksin sesuai kebutuhan dan usia hewan." },
              { icon: <Stethoscope size={22} color="var(--green)" />, title: "Konsultasi & Pemeriksaan", desc: "Pemeriksaan kesehatan dan konsultasi dengan dokter hewan untuk berbagai jenis hewan peliharaan." },
              { icon: <Hotel      size={22} color="var(--green)" />, title: "Hotel Hewan",              desc: "Penitipan hewan yang nyaman dan aman saat Anda bepergian, dengan pemantauan harian oleh staf berpengalaman." },
              { icon: <Scissors   size={22} color="var(--green)" />, title: "Grooming",                 desc: "Layanan grooming untuk anjing dan kucing, termasuk basic, treatment kutu/jamur, dan special treatment." },
              { icon: <Activity   size={22} color="var(--green)" />, title: "Bedah (Mayor & Minor)",    desc: "Layanan tindakan bedah mayor dan minor yang ditangani oleh tenaga profesional." },
              { icon: <Microscope size={22} color="var(--green)" />, title: "Laboratorium",             desc: "Pemeriksaan laboratorium untuk membantu diagnosis penyakit secara akurat." },
            ].map((s) => (
              <div className="service-card" key={s.title}>
                <div className="service-card-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <a href="#contact" className="service-link">Pesan Sekarang →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="section contact-section" id="contact">
        <div className="section-inner">
          <div className="section-header">
            <h2>Hubungi Kami</h2>
            <p>Buat janji atau tanyakan layanan yang Anda butuhkan</p>
          </div>
          <div className="contact-info" style={{ maxWidth: 760, margin: "0 auto" }}>
            <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Informasi Kontak</h3>
            <div className="contact-cards">
              {[
                { icon: <MapPin        size={18} color="var(--green)" />, label: "Alamat",   val: "Jl. Kesehatan Hewan No. 12, Batam, Kepri 29461" },
                { icon: <Phone         size={18} color="var(--green)" />, label: "Telepon",  val: "+62 778 123 4567" },
                { icon: <Mail          size={18} color="var(--green)" />, label: "Email",    val: "contact@sipeka.id" },
                { icon: <MessageCircle size={18} color="var(--green)" />, label: "WhatsApp", val: "+62 812 3456 7890" },
              ].map((c) => (
                <div className="contact-card" key={c.label}>
                  <div className="contact-icon">{c.icon}</div>
                  <div className="contact-card-text">
                    <strong>{c.label}</strong>
                    <span>{c.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo-wrap">
              <div className="footer-logo-icon">
                <PawPrint size={16} />
              </div>
              <span className="footer-logo-text">Sipeka</span>
            </div>
            <p>Platform booking dan manajemen layanan kesehatan hewan.</p>
          </div>
          <div className="footer-col">
            <h4>Menu</h4>
            <ul>
              {[
                { label: "Beranda", href: "home"    },
                { label: "Tentang", href: "about"   },
                { label: "Layanan", href: "service" },
                { label: "Kontak",  href: "contact" },
              ].map((l) => (
                <li key={l.href}><a href={`#${l.href}`}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Layanan</h4>
            <ul>
              {["Vaksinasi", "Laboratorium", "Hotel Hewan", "Grooming"].map((l) => (
                <li key={l}><a href="#service">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Ikuti Kami</h4>
            <ul>
              {["Instagram", "Facebook", "TikTok", "YouTube"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Sipeka · Web Kesehatan Hewan Terpercaya</p>
        </div>
      </footer>
    </>
  );
}