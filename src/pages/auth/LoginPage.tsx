import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email o contraseña incorrectos. Verificá tus datos.');
    } else {
      navigate('/dashboard', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-5 relative overflow-hidden">

      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-rose-100/50 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-100/40 blur-3xl" />
      </div>

      {/* Volver a la landing */}
      <Link
        to="/"
        className="absolute top-5 left-5 flex items-center gap-1.5 text-xs text-stone-400 hover:text-rose-500 transition-colors font-medium"
      >
        <ArrowLeft size={14} /> Ver tienda
      </Link>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="w-36 h-36 object-contain mx-auto mb-3 drop-shadow-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <p className="text-[10px] text-rose-400 font-semibold tracking-widest uppercase">Panel interno</p>
          <p className="text-sm text-stone-500 mt-0.5">Ingresá con tu cuenta</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_40px_rgb(0,0,0,0.07)] p-7">
          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                <input
                  type="email" autoComplete="email" required
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  placeholder="hola@midulcetentacion.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password" required
                  className="w-full pl-10 pr-11 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs text-red-500 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-3.5 rounded-full text-sm transition-all duration-300 shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Entrando…
                </span>
              ) : 'Entrar al panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-300 mt-6">
          Solo para uso interno · Dulce Tentación
        </p>
      </div>
    </div>
  );
}
