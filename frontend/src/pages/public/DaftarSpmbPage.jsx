// ============================================================
// src/pages/public/DaftarSpmbPage.jsx - Formulir SPMB Publik
// Palet: Sky Blue #5CB8FF | Soft Cream #FFF8EE | Dark Navy #243B53
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SpmbAPI } from '../../services/api.js';
import './DaftarSpmbPage.css';

// ═ COLOR PALETTE ═
const PRIMARY       = "#5CB8FF";   // Sky Blue
const PRIMARY_DARK  = "#1a8fd1";   // Sky Blue Darker
const PRIMARY_LIGHT = "#EBF6FF";   // Sky Blue Light
const NAVY          = "#243B53";   // Dark Navy
const CREAM         = "#FFF8EE";   // Soft Cream
const LIGHT_TEXT    = "#6b7280";
const SURFACE       = "#ffffff";
const BORDER        = "#d4eeff";
const ERROR         = "#ef4444";
const SUCCESS       = "#5CB8FF";
const WARNING       = "#f59e0b";

const DAFTAR_BERKAS = [
  { key: 'kk',     label: 'Kartu Keluarga (KK)',   keterangan: 'Format JPG/PNG/PDF, maks 10MB' },
  { key: 'ijazah', label: 'Ijazah Terakhir',        keterangan: 'Format JPG/PNG/PDF, maks 10MB' },
  { key: 'foto',   label: 'Foto 3x4 Terbaru',       keterangan: 'Format JPG/PNG, maks 10MB' },
];

function DaftarSpmbPage() {
  const [step, setStep]                   = useState(1);
  const [form, setForm]                   = useState({ nama_lengkap:'', email:'', nik:'', no_telp:'', password:'', konfirmasi_password:'', tanggal_lahir:'', jenis_kelamin:'L', jenjang_daftar:'paket_c', alamat:'', nama_wali:'' });
  const [pendaftarId, setPendaftarId]     = useState(null);
  const [files, setFiles]                 = useState({ kk:null, ijazah:null, foto:null });
  const [uploadStatus, setUploadStatus]   = useState({ kk:'idle', ijazah:'idle', foto:'idle' });
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = (key, file) => { setFiles(prev => ({ ...prev, [key]: file })); setUploadStatus(prev => ({ ...prev, [key]: 'idle' })); };

  const handleSubmitDataDiri = async (e) => {
    e.preventDefault(); setError('');
    const wajib = ['nama_lengkap','email','no_telp','password','konfirmasi_password','tanggal_lahir','jenjang_daftar','alamat','nama_wali'];
    for (const field of wajib) { if (!String(form[field]||'').trim()) { setError('Harap isi semua kolom yang bertanda bintang (*).'); return; } }
    if (form.password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (form.password !== form.konfirmasi_password) { setError('Konfirmasi password tidak cocok.'); return; }
    setLoading(true);
    try {
      const res = await SpmbAPI.daftar({ nama_lengkap:form.nama_lengkap.trim(), email:form.email.trim(), nik:form.nik.trim(), no_telp:form.no_telp.trim(), password:form.password, jenjang_daftar:form.jenjang_daftar, tanggal_lahir:form.tanggal_lahir, jenis_kelamin:form.jenis_kelamin, alamat:form.alamat.trim(), nama_wali:form.nama_wali.trim() });
      const id = res.data.data?.pendaftar_id;
      if (!id) throw new Error('Nomor pendaftar tidak ditemukan.');
      setPendaftarId(id); setStep(2); window.scrollTo({ top:0, behavior:'smooth' });
    } catch (err) { setError(err.response?.data?.message || err.message || 'Gagal mengirim data.'); }
    finally { setLoading(false); }
  };

  const handleUploadBerkas = async (key) => {
    if (!files[key] || !pendaftarId) return;
    setUploadStatus(prev => ({ ...prev, [key]: 'uploading' }));
    try {
      const fd = new FormData(); fd.append('file', files[key]); fd.append('jenis_berkas', key);
      await SpmbAPI.uploadBerkas(pendaftarId, fd);
      setUploadStatus(prev => ({ ...prev, [key]: 'done' }));
    } catch { setUploadStatus(prev => ({ ...prev, [key]: 'error' })); }
  };

  const semuaBerkasDone = DAFTAR_BERKAS.every(b => uploadStatus[b.key] === 'done');
  const handleSelesai = () => { setStep(3); window.scrollTo({ top:0, behavior:'smooth' }); };

  return (
    <div style={{ minHeight:'100vh', background: CREAM }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media (max-width: 768px) { .form-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${NAVY} 100%)`, padding:"48px 24px", textAlign:"center", color:"#fff" }}>
        <div style={{ width:52, height:52, background:"rgba(255,255,255,0.15)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:"1.5rem" }}>🎓</div>
        <h1 style={{ fontWeight:800, marginBottom:8, fontSize:"1.875rem" }}>Pendaftaran Warga Belajar Baru</h1>
        <p style={{ opacity:0.85, fontSize:"0.95rem" }}>PKBM Bina Mandiri - Paket A, B, dan C</p>
      </div>

      <div style={{ maxWidth:640, margin:"32px auto 0", padding:"0 24px" }}><StepIndicator step={step} /></div>

      <div style={{ maxWidth:640, margin:"24px auto 48px", padding:"0 24px" }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ background:SURFACE, borderRadius:"16px", padding:"32px", boxShadow:`0 8px 32px rgba(92,184,255,0.12)`, border:`1px solid ${BORDER}`, animation:"fadeInUp 0.4s ease-out" }}>
            <div style={{ marginBottom:"28px" }}>
              <h3 style={{ fontSize:"1.25rem", fontWeight:800, color:NAVY, marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ color:PRIMARY, fontSize:"1.5rem" }}>👤</span>Langkah 1: Data Diri Calon Warga Belajar
              </h3>
              <p style={{ fontSize:"0.9rem", color:LIGHT_TEXT, marginTop:6 }}>
                Isi formulir dengan data yang benar. Kolom bertanda <span style={{ color:ERROR, fontWeight:700 }}>*</span> wajib diisi.
              </p>
            </div>

            {error && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:`1.5px solid ${ERROR}`, borderRadius:"8px", padding:"12px 16px", marginBottom:"24px", display:"flex", alignItems:"flex-start", gap:12, color:ERROR, fontSize:"0.9rem" }}>
                <span style={{ fontSize:"1.2rem" }}>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDataDiri} style={{ marginBottom:24 }}>
              <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <FormInput label="Nama Lengkap" name="nama_lengkap" type="text" value={form.nama_lengkap} onChange={handleChange} required />
                <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <FormInput label="NIK" name="nik" type="text" value={form.nik} onChange={handleChange} placeholder="Opsional" />
                <FormInput label="No. Telepon" name="no_telp" type="tel" value={form.no_telp} onChange={handleChange} required />
              </div>
              <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <FormPasswordInput label="Password" name="password" value={form.password} onChange={handleChange} show={showPassword} onToggle={() => setShowPassword(!showPassword)} required />
                <FormPasswordInput label="Konfirmasi Password" name="konfirmasi_password" value={form.konfirmasi_password} onChange={handleChange} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} required />
              </div>
              <div className="form-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <FormInput label="Tanggal Lahir" name="tanggal_lahir" type="date" value={form.tanggal_lahir} onChange={handleChange} required />
                <FormSelect label="Jenis Kelamin" name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleChange} options={[{value:'L',label:'Laki-laki'},{value:'P',label:'Perempuan'}]} />
              </div>
              <div style={{ marginBottom:20 }}>
                <FormSelect label="Jenjang Pendaftaran" name="jenjang_daftar" value={form.jenjang_daftar} onChange={handleChange} options={[{value:'paket_a',label:'Paket A (Setara SD)'},{value:'paket_b',label:'Paket B (Setara SMP)'},{value:'paket_c',label:'Paket C (Setara SMA)'}]} required />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:"0.9rem", fontWeight:600, color:NAVY, marginBottom:8 }}>Alamat Lengkap <span style={{ color:ERROR }}>*</span></label>
                <textarea name="alamat" value={form.alamat} onChange={handleChange} required placeholder="Jalan, RT/RW, Desa, Kecamatan, Kabupaten"
                  style={{ width:"100%", padding:"12px 16px", fontSize:"0.95rem", border:`1.5px solid ${BORDER}`, borderRadius:"8px", outline:"none", boxSizing:"border-box", color:NAVY, background:"#fff", minHeight:"100px", fontFamily:"inherit", resize:"vertical" }}
                  onFocus={e => { e.target.style.borderColor=PRIMARY; e.target.style.boxShadow="0 0 0 3px rgba(92,184,255,0.2)"; }}
                  onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow="none"; }} />
              </div>
              <div style={{ marginBottom:28 }}>
                <FormInput label="Nama Wali / Orang Tua" name="nama_wali" type="text" value={form.nama_wali} onChange={handleChange} required />
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"13px 16px", fontSize:"0.95rem", fontWeight:700, color:"#fff", background:loading ? `${PRIMARY}99` : `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`, border:"none", borderRadius:"8px", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 4px 14px rgba(92,184,255,0.3)` }}>
                {loading ? <><div style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />Memproses...</> : <>Lanjut ke Langkah 2 →</>}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ background:SURFACE, borderRadius:"16px", padding:"32px", boxShadow:`0 8px 32px rgba(92,184,255,0.12)`, border:`1px solid ${BORDER}`, animation:"fadeInUp 0.4s ease-out" }}>
            <div style={{ marginBottom:"28px" }}>
              <h3 style={{ fontSize:"1.25rem", fontWeight:800, color:NAVY, marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ color:PRIMARY, fontSize:"1.5rem" }}>📄</span>Langkah 2: Upload Berkas Pendukung
              </h3>
              <p style={{ fontSize:"0.9rem", color:LIGHT_TEXT }}>Semua berkas wajib diupload untuk melanjutkan.</p>
            </div>
            <div style={{ marginBottom:28 }}>
              {DAFTAR_BERKAS.map(berkas => (
                <BerkasUploadCard key={berkas.key} berkas={berkas} file={files[berkas.key]} status={uploadStatus[berkas.key]} onFileChange={file => handleFileChange(berkas.key, file)} onUpload={() => handleUploadBerkas(berkas.key)} />
              ))}
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => setStep(1)} style={{ flex:1, padding:"12px 16px", fontWeight:700, color:PRIMARY_DARK, background:"#EBF6FF", border:"none", borderRadius:"8px", cursor:"pointer" }}>← Kembali</button>
              <button onClick={handleSelesai} disabled={!semuaBerkasDone}
                style={{ flex:1, padding:"12px 16px", fontWeight:700, color:"#fff", background:semuaBerkasDone?`linear-gradient(135deg,${PRIMARY},${PRIMARY_DARK})`:`${PRIMARY}55`, border:"none", borderRadius:"8px", cursor:semuaBerkasDone?"pointer":"not-allowed" }}>
                Selesaikan Pendaftaran ✓
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ background:SURFACE, borderRadius:"16px", padding:"48px 32px", boxShadow:`0 8px 32px rgba(92,184,255,0.12)`, border:`1px solid ${BORDER}`, textAlign:"center", animation:"fadeInUp 0.4s ease-out" }}>
            <div style={{ width:80, height:80, background:"rgba(92,184,255,0.1)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:"2.5rem" }}>✅</div>
            <h2 style={{ fontSize:"1.5rem", fontWeight:800, color:NAVY, marginBottom:12 }}>Pendaftaran Berhasil!</h2>
            <p style={{ fontSize:"0.95rem", color:LIGHT_TEXT, marginBottom:16, lineHeight:1.6 }}>Terima kasih telah mendaftar di PKBM Bina Mandiri.</p>
            <p style={{ fontSize:"0.9rem", color:PRIMARY_DARK, background:"#EBF6FF", padding:"12px 16px", borderRadius:"8px", marginBottom:28, fontWeight:600 }}>
              <strong>Nomor Pendaftar:</strong> #{String(pendaftarId).padStart(6,'0')}
            </p>
            <p style={{ fontSize:"0.9rem", color:LIGHT_TEXT, marginBottom:28, lineHeight:1.6 }}>Tim kami akan memverifikasi data Anda dalam 1–3 hari kerja.</p>
            <div style={{ display:"flex", gap:12 }}>
              <Link to="/" style={{ flex:1, padding:"12px 16px", fontWeight:700, color:NAVY, background:"#f0f7ff", borderRadius:"8px", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>Kembali ke Beranda</Link>
              <Link to="/login" style={{ flex:1, padding:"12px 16px", fontWeight:700, color:"#fff", background:`linear-gradient(135deg,${PRIMARY},${PRIMARY_DARK})`, borderRadius:"8px", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>Masuk Akun</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═ HELPER COMPONENTS ═

function StepIndicator({ step }) {
  const steps = [{ num:1, label:'Data Diri' }, { num:2, label:'Upload Berkas' }, { num:3, label:'Selesai' }];
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:"0.5rem" }}>
      {steps.map((s, i) => (
        <div key={s.num} style={{ display:"flex", alignItems:"center", flex: i < steps.length-1 ? 1 : "none" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: step>=s.num ? "#5CB8FF" : "#d4eeff", color: step>=s.num ? "white" : "#6b7280", fontWeight:800, fontSize:"0.875rem" }}>
            {step > s.num ? "✓" : s.num}
          </div>
          <span style={{ marginLeft:8, fontSize:"0.75rem", fontWeight:700, color: step>=s.num ? "#1a8fd1" : "#6b7280", whiteSpace:"nowrap" }}>{s.label}</span>
          {i < steps.length-1 && <div style={{ flex:1, height:2, background: step>s.num ? "#5CB8FF" : "#d4eeff", margin:"0 12px" }} />}
        </div>
      ))}
    </div>
  );
}

function FormInput({ label, name, type, value, onChange, required, placeholder }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:"0.9rem", fontWeight:600, color:NAVY, marginBottom:8 }}>
        {label} {required && <span style={{ color:ERROR }}>*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        style={{ width:"100%", padding:"12px 16px", fontSize:"0.95rem", border:`1.5px solid ${BORDER}`, borderRadius:"8px", outline:"none", boxSizing:"border-box", color:NAVY, background:"#fff", fontFamily:"inherit" }}
        onFocus={e => { e.target.style.borderColor=PRIMARY; e.target.style.boxShadow="0 0 0 3px rgba(92,184,255,0.2)"; }}
        onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow="none"; }} />
    </div>
  );
}

function FormPasswordInput({ label, name, value, onChange, show, onToggle, required }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:"0.9rem", fontWeight:600, color:NAVY, marginBottom:8 }}>
        {label} {required && <span style={{ color:ERROR }}>*</span>}
      </label>
      <div style={{ position:"relative" }}>
        <input type={show?"text":"password"} name={name} value={value} onChange={onChange} required={required} placeholder="••••••••"
          style={{ width:"100%", padding:"12px 44px 12px 16px", fontSize:"0.95rem", border:`1.5px solid ${BORDER}`, borderRadius:"8px", outline:"none", boxSizing:"border-box", color:NAVY, background:"#fff", fontFamily:"inherit" }}
          onFocus={e => { e.target.style.borderColor=PRIMARY; e.target.style.boxShadow="0 0 0 3px rgba(92,184,255,0.2)"; }}
          onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow="none"; }} />
        <button type="button" onClick={onToggle}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6b7280", fontSize:"1rem", padding:"4px" }}>
          {show ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, required }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:"0.9rem", fontWeight:600, color:NAVY, marginBottom:8 }}>
        {label} {required && <span style={{ color:ERROR }}>*</span>}
      </label>
      <select name={name} value={value} onChange={onChange} required={required}
        style={{ width:"100%", padding:"12px 36px 12px 16px", fontSize:"0.95rem", border:`1.5px solid ${BORDER}`, borderRadius:"8px", outline:"none", boxSizing:"border-box", color:NAVY, background:"#fff", fontFamily:"inherit", cursor:"pointer", appearance:"none",
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23243B53' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center" }}
        onFocus={e => { e.target.style.borderColor=PRIMARY; e.target.style.boxShadow="0 0 0 3px rgba(92,184,255,0.2)"; }}
        onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow="none"; }}>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function BerkasUploadCard({ berkas, file, status, onFileChange, onUpload }) {
  const statusConfig = {
    idle:      { color:LIGHT_TEXT, label:"Belum Upload" },
    uploading: { color:WARNING, label:"Mengunggah..." },
    done:      { color:PRIMARY_DARK, label:"✓ Berhasil" },
    error:     { color:ERROR, label:"✗ Gagal" },
  };
  const cfg = statusConfig[status];
  return (
    <div style={{ background: status==='done' ? "#EBF6FF" : SURFACE, border:`1.5px dashed ${status==='done'?PRIMARY:BORDER}`, borderRadius:"12px", padding:"24px", marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
        <div>
          <h4 style={{ fontSize:"0.95rem", fontWeight:700, color:NAVY, marginBottom:4 }}>{berkas.label}</h4>
          <p style={{ fontSize:"0.8rem", color:LIGHT_TEXT }}>{berkas.keterangan}</p>
        </div>
        {status !== 'idle' && <span style={{ fontSize:"0.78rem", fontWeight:700, color:cfg.color, padding:"4px 10px", background:`${cfg.color}15`, borderRadius:"6px" }}>{cfg.label}</span>}
      </div>

      <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"14px", background:"#f0f7ff", border:`1.5px dashed ${BORDER}`, borderRadius:"8px", cursor:"pointer", fontSize:"0.9rem", fontWeight:600, color:NAVY }}>
        <span>📁</span><span>{file ? file.name : "Klik untuk pilih file"}</span>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => onFileChange(e.target.files?.[0]||null)} disabled={status==='uploading'||status==='done'} style={{ display:"none" }} />
      </label>

      {file && status==='idle' && (
        <button onClick={onUpload} style={{ width:"100%", marginTop:"12px", padding:"10px 16px", fontSize:"0.9rem", fontWeight:700, color:"#fff", background:`linear-gradient(135deg,${PRIMARY},${PRIMARY_DARK})`, border:"none", borderRadius:"8px", cursor:"pointer" }}>
          Upload Berkas
        </button>
      )}
      {status==='uploading' && <div style={{ textAlign:"center", padding:"12px", color:WARNING, fontWeight:600 }}>⏳ Sedang mengunggah...</div>}
      {status==='done' && <div style={{ textAlign:"center", padding:"12px", color:PRIMARY_DARK, fontWeight:700 }}>✓ Berkas berhasil diupload</div>}
      {status==='error' && (
        <div style={{ textAlign:"center", padding:"12px" }}>
          <p style={{ color:ERROR, fontSize:"0.9rem", marginBottom:8 }}>Upload gagal, coba lagi</p>
          <button onClick={onUpload} style={{ padding:"8px 16px", fontSize:"0.85rem", fontWeight:700, color:"#fff", background:ERROR, border:"none", borderRadius:"6px", cursor:"pointer" }}>Coba Lagi</button>
        </div>
      )}
    </div>
  );
}

export default DaftarSpmbPage;