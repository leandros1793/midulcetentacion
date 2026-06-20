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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blush-50 to-warm-100 flex flex-col items-center justify-center p-4">

      {/* Volver a la landing */}
      <Link to="/" className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-rose-500 transition-colors">
        <ArrowLeft size={16} /> Ver tienda
      </Link>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="w-40 h-40 object-contain mx-auto mb-2 drop-shadow-md"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <p className="text-sm text-gray-500 mt-1">Panel de gestión interno</p>
        </div>

        {/* Formulario */}
        <div className="card shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-2.5 text-gray-300" />
                <input
                  type="email" autoComplete="email" required
                  className="input pl-9"
                  placeholder="hola@midulcetentacion.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-2.5 text-gray-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password" required
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-2.5 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando…' : 'Entrar al panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Solo para uso interno · Mi Dulce Tentación
        </p>
      </div>
    </div>
  );
}
