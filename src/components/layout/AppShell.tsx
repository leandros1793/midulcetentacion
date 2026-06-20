import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBasket, BookOpen,
  Settings, ChefHat, LogOut, Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard',               icon: LayoutDashboard, label: 'Inicio'       },
  { to: '/dashboard/ingredientes',  icon: ShoppingBasket,  label: 'Ingredientes' },
  { to: '/dashboard/recetas',       icon: BookOpen,        label: 'Recetas'      },
  { to: '/dashboard/promociones',   icon: Megaphone,       label: 'Promos'       },
  { to: '/dashboard/configuracion', icon: Settings,        label: 'Config'       },
];

export default function AppShell() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut } = useAuth();

  const EXTRA_TITLES: Record<string, string> = { '/dashboard/gastos': 'Gastos Generales' };
  const current = NAV.find(n => location.pathname.startsWith(n.to) && n.to !== '/dashboard')?.label
    ?? EXTRA_TITLES[location.pathname]
    ?? (location.pathname === '/dashboard' ? 'Inicio' : 'Mi Dulce Tentación');

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 max-w-md mx-auto relative">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100 shadow-[0_1px_12px_rgb(0,0,0,0.04)] px-4 py-3 flex items-center gap-3">
        <div className="bg-rose-500 rounded-2xl p-1.5 shadow-sm shadow-rose-200">
          <ChefHat size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-rose-400 font-semibold tracking-widest uppercase leading-none">Mi Dulce Tentación</p>
          <h1 className="text-sm font-bold text-stone-800 tracking-tight truncate">{current}</h1>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="text-stone-300 hover:text-rose-500 transition-all duration-200 p-1.5 rounded-xl hover:bg-rose-50"
        >
          <LogOut size={17} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-stone-100 z-30 flex shadow-[0_-4px_20px_rgb(0,0,0,0.06)]">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all duration-200 ${
                isActive ? 'text-rose-500' : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`p-1 rounded-xl transition-all duration-200 ${isActive ? 'bg-rose-50' : ''}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
