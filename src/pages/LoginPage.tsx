import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../stores/langStore';

// ===========================================
// СТРАНИЦА ВХОДА В СИСТЕМУ
// Full-dark, единая палитра (--bg-primary / --color-rm / --text-primary).
// ===========================================

export function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(employeeId, password);
      navigate('/rating');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'var(--bg-primary)' }}>
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div
        className="relative lg:w-[480px] xl:w-[520px] shrink-0 overflow-hidden flex flex-col items-center justify-center px-8 py-12 lg:py-0"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Радиальный gold-glow поверх */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(200,168,75,0.10), transparent 60%), radial-gradient(ellipse at 70% 90%, rgba(167,139,250,0.06), transparent 60%)',
          }}
        />

        {/* Точечная сетка (HUD) */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-rm) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Декоративные кольца */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
            style={{ border: '1px solid var(--color-rm-border)', opacity: 0.4 }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
            style={{ border: '1px solid var(--border-strong)', opacity: 0.3 }}
          />
          <div
            className="absolute top-1/3 right-10 w-40 h-40 rounded-full"
            style={{ border: '1px solid var(--color-rm-border)', opacity: 0.25 }}
          />
        </div>

        {/* Контент */}
        <div className="relative z-10 text-center max-w-sm">
          {/* Логотип — реальная картинка с золотой рамкой и glow */}
          <div
            className="mx-auto mb-8 w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--color-rm-border)',
              boxShadow: '0 0 32px rgba(200,168,75,0.18), 0 0 0 1px rgba(200,168,75,0.20) inset',
            }}
          >
            <img
              src="/tactical/traektoriya-logo.jpg"
              alt="Traektoriya"
              className="w-full h-full object-cover"
            />
          </div>

          <h1
            className="mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 36px)',
              letterSpacing: '0.18em',
              background: 'linear-gradient(180deg, #DBC074 0%, #C8A84B 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TRAEKTORIYA
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.3em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            С нуля до эксперта
          </div>

          <p
            className="mx-auto leading-relaxed"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 14,
              maxWidth: 320,
            }}
          >
            {t('login.subtitle')}
          </p>
        </div>

        {/* Footer-подпись по центру внизу — без N'Medov */}
        <div
          className="absolute bottom-6 left-0 right-0 text-center px-6 z-10"
          style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
          }}
        >
          AI · Микрообучение · Полевая практика
        </div>
      </div>

      {/* ===== RIGHT FORM PANEL ===== */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-0"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {t('login.heading')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
              {t('login.subheading')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee ID field */}
            <div>
              <label
                className="block mb-1.5"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
              >
                {t('login.employeeId')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder={t('login.employeePlaceholder')}
                  className="w-full py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                className="block mb-1.5"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
              >
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full py-2.5 pl-11 pr-11 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-2.5 p-3 text-sm"
                style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                }}
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button — gold (--color-rm) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-semibold transition-all"
              style={{
                background: isLoading ? 'var(--text-muted)' : 'var(--color-rm)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.loading')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          {/* Нейтральный footer без брендов и юр-лиц */}
          <p
            className="mt-10 text-center"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}
          >
            v3.1 · Корпоративная платформа развития
          </p>
        </div>
      </div>
    </div>
  );
}
