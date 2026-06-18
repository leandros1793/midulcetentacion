import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/dashboard/DashboardPage';
import IngredientesPage from './pages/ingredientes/IngredientesPage';
import RecetasPage from './pages/recetas/RecetasPage';
import GastosPage from './pages/gastos/GastosPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/ingredientes" element={<IngredientesPage />} />
          <Route path="/recetas" element={<RecetasPage />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
