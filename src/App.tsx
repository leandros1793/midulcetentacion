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
import PromocionesPage    from './pages/promociones/PromocionesPage';
import PedidosPage        from './pages/pedidos/PedidosPage';
import ReporteMensualPage from './pages/reportes/ReporteMensualPage';
import ErrorBoundary      from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Rutas públicas ────────────────────────────────────────────── */}
          <Route path="/"      element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── Rutas protegidas (requieren sesión Supabase) ──────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppShell />}>
              <Route index               element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              <Route path="ingredientes" element={<ErrorBoundary><IngredientesPage /></ErrorBoundary>} />
              <Route path="recetas"      element={<ErrorBoundary><RecetasPage /></ErrorBoundary>} />
              <Route path="gastos"       element={<ErrorBoundary><GastosPage /></ErrorBoundary>} />
              <Route path="configuracion" element={<ErrorBoundary><ConfiguracionPage /></ErrorBoundary>} />
              <Route path="promociones"  element={<ErrorBoundary><PromocionesPage /></ErrorBoundary>} />
              <Route path="pedidos"      element={<ErrorBoundary><PedidosPage /></ErrorBoundary>} />
              <Route path="reporte"      element={<ErrorBoundary><ReporteMensualPage /></ErrorBoundary>} />
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
