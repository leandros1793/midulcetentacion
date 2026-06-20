import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBasket, BookOpen,
  Receipt, Settings, ChefHat, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard',               icon: LayoutDashboard, label: 'Inicio'       },
  { to: '/dashboard/ingredientes',  icon: ShoppingBasket,  label: 'Ingredientes' },
  { to: '/dashboard/recetas',       icon: BookOpen,        label: 'Recetas'      },
  { to: '/dashboard/gastos',        icon: Receipt,         label: 'Gastos'       },
  { to: '/dashboard/configuracion', icon: Settings,        label: 'Config'       },
];

export default function AppShell() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { signOut } = useAuth();

  const current = NAV.find(n => location.pathname.startsWith(n.to) && n.to !== '/dashboard')?.label
    ?? (location.pathname === '/dashboard' ? 'Inicio' : 'Mi Dulce Tentación');

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-50 max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-warm-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="bg-rose-500 rounded-xl p-1.5">
          <ChefHat size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-rose-400 font-medium leading-none">Mi Dulce Tentación</p>
          <h1 className="text-sm font-bold text-gray-800">{current}</h1>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="text-gray-300 hover:text-rose-500 transition-colors p-1"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-warm-100 z-30 flex">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
