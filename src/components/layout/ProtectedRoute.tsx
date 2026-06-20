import { Navigate, Outlet } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/** Envuelve rutas que requieren sesión activa. Redirige a /login si no hay usuario. */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-warm-50">
        <div className="bg-rose-500 rounded-2xl p-3 animate-pulse">
          <ChefHat size={28} className="text-white" />
        </div>
        <p className="text-sm text-gray-400">Verificando sesión…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
