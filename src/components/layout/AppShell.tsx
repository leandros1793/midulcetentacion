import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Iconos SVG artesanales (tema pasteleria)

function IcoTorta({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2.1 : 1.6;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-.8 1.2-1.2 2.2-1.2 3h2.4C13.2 4.2 12.8 3.2 12 2z"
        fill="currentColor" fillOpacity={active ? 0.4 : 0.25} />
      <line x1="12" y1="5" x2="12" y2="7" strokeWidth="1.4" />
      <rect x="8.5" y="7" width="7" height="3" rx="1" />
      <path d="M5 12.5c1.2-1 2.4 1 3.6 0 1.2-1 2.4 1 3.6 0 1.2-1 2.4 1 3.6 0 1.2-1 2.2 1 3.2 0"
        strokeWidth="1.1" opacity="0.7" />
      <rect x="4" y="10" width="16" height="5" rx="1.2" />
      <rect x="2.5" y="15" width="19" height="5" rx="1.5" />
    </svg>
  );
}

function IcoBolsa({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2.1 : 1.6;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 8h13l-1.6 11.5a1.5 1.5 0 0 1-1.5 1.3H8.6a1.5 1.5 0 0 1-1.5-1.3z"
        fill="currentColor" fillOpacity={active ? 0.12 : 0.06} />
      <path d="M5.5 8h13l-1.6 11.5a1.5 1.5 0 0 1-1.5 1.3H8.6a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M9 8V5.5a3 3 0 0 1 6 0V8" />
      <line x1="12" y1="13" x2="12" y2="17" strokeWidth={active ? 2.2 : 1.8} />
      <line x1="10" y1="15" x2="14" y2="15" strokeWidth={active ? 2.2 : 1.8} />
    </svg>
  );
}

function IcoLibro({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2.1 : 1.6;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h7v16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        fill="currentColor" fillOpacity={active ? 0.12 : 0.06} />
      <path d="M4 4h7v16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M20 4h-7v16h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"
        fill="currentColor" fillOpacity={active ? 0.07 : 0.03} />
      <path d="M20 4h-7v16h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" />
      <line x1="11" y1="4" x2="11" y2="20" strokeWidth="1.2" />
      <line x1="6" y1="9" x2="9" y2="9" strokeWidth="1.2" />
      <line x1="6" y1="12" x2="9" y2="12" strokeWidth="1.2" />
      <line x1="6" y1="15" x2="9" y2="15" strokeWidth="1.2" />
      <path d="M15 8c0 0 1 2.5 1 4s-1 2.5-1 2.5" strokeWidth="1.4" />
      <path d="M17 8c0 0 1 2.5 1 4s-1 2.5-1 2.5" strokeWidth="1.4" />
      <path d="M14.5 8.5l4 0" strokeWidth="1.2" />
      <line x1="16" y1="14.5" x2="16" y2="17" strokeWidth="1.4" />
    </svg>
  );
}

function IcoPastel({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2.1 : 1.6;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12L12 3a9 9 0 0 1 9 9z"
        fill="currentColor" fillOpacity={active ? 0.20 : 0.10} />
      <path d="M12 12L12 3a9 9 0 0 1 9 9z" />
      <path d="M12 12L21 12a9 9 0 0 1-5.9 8.5z"
        fill="currentColor" fillOpacity={active ? 0.12 : 0.06} />
      <path d="M12 12L21 12a9 9 0 0 1-5.9 8.5z" />
      <path d="M12 12L15.1 20.5A9 9 0 1 1 12 3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IcoDials({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2.1 : 1.6;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
      <circle cx="8" cy="7" r="3" fill="white" stroke="currentColor" strokeWidth={sw} />
      <circle cx="16" cy="12" r="3" fill="white" stroke="currentColor" strokeWidth={sw} />
      <circle cx="8" cy="17" r="3" fill="white" stroke="currentColor" strokeWidth={sw} />
    </svg>
  );
}


function IcoVitrina({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2.1 : 1.6;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {/* Awning */}
      <path d="M3 7h18l-2 4H5z"
        fill="currentColor" fillOpacity={active ? 0.20 : 0.10} />
      <path d="M3 7h18l-2 4H5z" />
      {/* Shop body */}
      <rect x="5" y="11" width="14" height="9" rx="1" />
      {/* Door */}
      <rect x="10" y="15" width="4" height="5" rx="0.5"
        fill="currentColor" fillOpacity={active ? 0.15 : 0.07} />
      {/* Window left */}
      <rect x="6.5" y="13" width="2.5" height="2" rx="0.4"
        fill="currentColor" fillOpacity={active ? 0.20 : 0.10} />
      {/* Window right */}
      <rect x="15" y="13" width="2.5" height="2" rx="0.4"
        fill="currentColor" fillOpacity={active ? 0.20 : 0.10} />
      {/* Roof line */}
      <line x1="2" y1="7" x2="22" y2="7" strokeWidth="1.8" />
    </svg>
  );
}

// Nav items

const NAV = [
  { to: '/dashboard',               Icon: IcoTorta,   label: 'Inicio'  },
  { to: '/dashboard/menu',          Icon: IcoVitrina, label: 'Menú'    },
  { to: '/dashboard/pedidos',       Icon: IcoBolsa,   label: 'Pedidos' },
  { to: '/dashboard/recetas',       Icon: IcoLibro,   label: 'Recetas' },
  { to: '/dashboard/configuracion', Icon: IcoDials,   label: 'Config'  },
];

// AppShell

export default function AppShell() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut } = useAuth();

  const EXTRA_TITLES: Record<string, string> = {
    '/dashboard/gastos':       'Gastos Generales',
    '/dashboard/ingredientes': 'Ingredientes',
    '/dashboard/promociones':  'Promociones',
    '/dashboard/reporte':      'Reporte mensual',
    '/dashboard/menu':         'Menú público',
  };
  const current =
    NAV.find(n => location.pathname.startsWith(n.to) && n.to !== '/dashboard')?.label
    ?? EXTRA_TITLES[location.pathname]
    ?? (location.pathname === '/dashboard' ? 'Inicio' : 'Mi Dulce Tentacion');

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 max-w-md mx-auto relative">

      {/* Header premium */}
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-2xl border-b border-stone-100/80 shadow-[0_1px_16px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-3">

        {/* Logo con degradado y acento dorado */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 shadow-[0_4px_14px_rgba(244,63,94,0.38)] flex items-center justify-center">
            <ChefHat size={17} className="text-white" strokeWidth={2.2} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-white shadow-sm" />
        </div>

        {/* Marca + titulo de seccion */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[8.5px] font-black tracking-[0.22em] uppercase leading-none mb-0.5"
            style={{
              background: 'linear-gradient(90deg, #fb7185 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Mi Dulce Tentacion
          </p>
          <h1 className="text-sm font-bold text-stone-800 tracking-tight truncate">{current}</h1>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Cerrar sesion"
          className="text-stone-300 hover:text-rose-500 transition-all duration-200 p-1.5 rounded-xl hover:bg-rose-50"
        >
          <LogOut size={17} />
        </button>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-28">
        <Outlet />
      </main>

      {/* Nav flotante tipo pildora */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-20px)] max-w-[430px]">
        <nav className="bg-white/96 backdrop-blur-2xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 flex items-stretch px-2 py-1.5">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className="flex-1"
            >
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-[20px] transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_4px_14px_rgba(244,63,94,0.38)]'
                      : 'hover:bg-stone-50'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-stone-400'}>
                    <Icon size={20} active={isActive} />
                  </span>
                  <span
                    className={`text-[9px] font-bold tracking-wide leading-none ${
                      isActive ? 'text-white' : 'text-stone-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
