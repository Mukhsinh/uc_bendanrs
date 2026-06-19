import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CalendarDays, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useYear } from '@/contexts/YearContext';
import { authService, TenantInfo } from '@/lib/authService';

const COPYRIGHT_TEXT = 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang';
const HERO_TITLE_TEXT = 'Saatnya Rumah Sakit Anda Naik Kelas!';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [fetchingTenants, setFetchingTenants] = useState(true);
  const { session, initializing, signInWithPassword, loading: authLoading } = useAuth();
  const { selectedYear, setSelectedYear, availableYears } = useYear();

  useEffect(() => {
    if (!initializing && session) {
      navigate('/');
    }
  }, [navigate, session, initializing]);

  useEffect(() => {
    let currentIndex = 0;
    setHeroTitle('');
    const interval = window.setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= HERO_TITLE_TEXT.length) {
        currentIndex = HERO_TITLE_TEXT.length;
        window.clearInterval(interval);
      }
      setHeroTitle(HERO_TITLE_TEXT.slice(0, currentIndex));
    }, 60);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setFetchingTenants(true);
        const { data, error } = await authService.getTenants();
        if (data) {
          setTenants(data);
          // Auto-select first tenant if available
          if (data.length > 0) {
            setSelectedTenantId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      } finally {
        setFetchingTenants(false);
      }
    };

    fetchTenants();
  }, []);

  const heroTitleWithoutExclamation = heroTitle.endsWith('!')
    ? heroTitle.slice(0, heroTitle.length - 1)
    : heroTitle;
  const shouldShowExclamation = heroTitle.includes('!');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    const trimmedEmail = email.trim();

    const error = await signInWithPassword({
      email: trimmedEmail,
      password,
      selectedTenantId,
    });

    if (error) {
      setErrorMessage(error.message || 'Email atau kata sandi tidak sesuai.');
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#089e8f] via-[#0585a1] to-[#045f7c] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr]">
          <div className="relative bg-gradient-to-br from-white via-[#d7f4ef] to-[#b6e5dd] p-10 flex flex-col justify-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-10 right-0 w-40 h-40 rounded-full bg-[#55d1c0]/45 blur-xl" />
            </div>

            <div className="relative z-10 max-w-md">
              <h1
                className="text-2xl md:text-3xl font-bold text-[#2f4373] mb-4 leading-tight"
                aria-live="polite"
              >
                {heroTitleWithoutExclamation}
                {shouldShowExclamation && <span className="text-[#2dc6a7]">!</span>}
                <span
                  className="ml-1 inline-block h-5 w-0.5 bg-[#2f4373] align-middle animate-pulse"
                  aria-hidden="true"
                />
              </h1>
              <p className="text-[#5c6c90] text-base md:text-lg leading-normal">
                "Sering kali kita berbicara tentang mutu, efisiensi, dan kemandirian, tetapi... seberapa dalam kita memahami biaya di balik setiap tindakan?"
              </p>
            </div>

            <div className="relative z-10 mt-10 flex justify-center">
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white via-white/90 to-transparent"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent"
                  aria-hidden="true"
                />
                <img
                  src="/gambar.PNG"
                  alt="Ilustrasi Analisis Unit Cost"
                  className="w-64 md:w-80 h-auto drop-shadow-xl relative z-10"
                />
              </div>
            </div>
            <p className="relative z-10 mt-6 text-center text-sm text-[#4c5f8b]">
              {COPYRIGHT_TEXT}
            </p>
          </div>

          <div className="p-10 md:p-16 bg-white flex flex-col justify-center">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2f4373] uppercase tracking-wide leading-tight">
                PINTAR <span className="text-[#1fb5a8]">U</span><span className="text-[#0f6fb4]">C</span>
              </h2>
              <p className="text-[#5c6c90] mt-3 leading-relaxed">
                Aplikasi perhitungan unit cost rumah sakit terintegrasi
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Pilihan Organisasi */}
              <div className="space-y-2">
                <label
                  htmlFor="tenant"
                  className="block text-sm font-medium text-[#4c5f8b]"
                >
                  Pilih Organisasi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#7f8eb4]">
                    <Building2 size={18} />
                  </span>
                  <select
                    id="tenant"
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    disabled={authLoading || fetchingTenants}
                    className="w-full appearance-none rounded-xl border border-[#d2dcf3] bg-[#f7faff] pl-10 pr-10 py-3 text-[#2f4373] focus:outline-none focus:ring-2 focus:ring-[#5aa9ff] focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {fetchingTenants ? (
                      <option>Memuat organisasi...</option>
                    ) : tenants.length > 0 ? (
                      tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Tidak ada organisasi tersedia</option>
                    )}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#7f8eb4]">
                    <ChevronDown size={18} />
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#4c5f8b]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#d2dcf3] bg-[#f7faff] px-4 py-3 text-[#2f4373] focus:outline-none focus:ring-2 focus:ring-[#5aa9ff] focus:border-transparent transition"
                  placeholder="nama@rumahsakit.com"
                  disabled={authLoading}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#4c5f8b]"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-[#d2dcf3] bg-[#f7faff] px-4 py-3 text-[#2f4373] focus:outline-none focus:ring-2 focus:ring-[#5aa9ff] focus:border-transparent transition pr-11"
                    placeholder="Masukkan kata sandi"
                    disabled={authLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center justify-center text-[#7f8eb4] hover:text-[#5aa9ff] transition"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    disabled={authLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Pilihan Tahun */}
              <div className="space-y-2">
                <label
                  htmlFor="tahun"
                  className="block text-sm font-medium text-[#4c5f8b]"
                >
                  Tahun Data
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#7f8eb4]">
                    <CalendarDays size={18} />
                  </span>
                  <select
                    id="tahun"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    disabled={authLoading}
                    className="w-full appearance-none rounded-xl border border-[#d2dcf3] bg-[#f7faff] pl-10 pr-10 py-3 text-[#2f4373] focus:outline-none focus:ring-2 focus:ring-[#5aa9ff] focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#7f8eb4]">
                    <ChevronDown size={18} />
                  </span>
                </div>
                <p className="text-xs text-[#8fa3c8]">
                  Data yang ditampilkan di semua halaman akan difilter sesuai tahun ini secara default.
                </p>
              </div>

              {errorMessage && (
                <p className="text-sm text-red-500 text-center lg:text-left">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-gradient-to-r from-[#5aa9ff] to-[#547bff] text-white py-3 font-semibold shadow-lg shadow-[#5aa9ff]/40 hover:shadow-xl hover:shadow-[#5aa9ff]/50 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;