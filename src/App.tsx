import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Páginas públicas
import LandingPage from './pages/public/LandingPage';
import LoginPage   from './pages/auth/LoginPage';

// Layout protegido
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell       from './components/layout/AppShell';

// Páginas del dashboard
import DashboardPage      from './pages/dashboard/DashboardPage';
import IngredientesPage   from './pages/ingredientes/IngredientesPage';
import RecetasPage        from './pages/recetas/RecetasPage';
import GastosPage         from './pages/gastos/GastosPage';
import ConfiguracionPage  from './pages/configuracion/ConfiguracionPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Rutas públicas ────────────────────────────────────────────── */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── Rutas protegidas (requieren sesión Supabase) ──────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppShell />}>
              <Route index                   element={<DashboardPage />} />
              <Route path="ingredientes"     element={<IngredientesPage />} />
              <Route path="recetas"          element={<RecetasPage />} />
              <Route path="gastos"           element={<GastosPage />} />
              <Route path="configuracion"    element={<ConfiguracionPage />} />
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
