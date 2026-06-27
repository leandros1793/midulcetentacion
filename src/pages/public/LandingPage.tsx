import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Star, Heart, Sparkles, Flame, Tag, Instagram, ExternalLink } from 'lucide-react';
import { ingredientesService, recetasService, configuracionService, promocionesService } from '../../services';
import { calcCostoLinea } from '../../types';
import type { Receta, Promocion } from '../../types';
import { formatARS as _fmt } from '../../utils/format';

// ── WhatsApp SVG Icon ─────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.001 2C6.479 2 2.001 6.478 2.001 12c0 1.946.537 3.769 1.47 5.33L2 22l4.797-1.438A9.957 9.957 0 0 0 12.001 22c5.522 0 10-4.478 10-10S17.523 2 12.001 2Zm0 18c-1.71 0-3.305-.47-4.67-1.285l-.334-.2-3.464 1.038 1.07-3.36-.218-.346A7.948 7.948 0 0 1 4.001 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8Zm4.39-5.847c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.013-.373-1.93-1.19-.713-.636-1.194-1.422-1.334-1.662-.14-.24-.015-.37.105-.49.108-.107.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.468-.393-.404-.54-.412l-.46-.008c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.693 2.585 4.103 3.623.574.247 1.02.395 1.37.506.576.183 1.1.157 1.514.095.462-.069 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatARS(n: number) { return _fmt(n, 0); }

function buildWhatsAppLink(numero: string, nombreProducto: string) {
  const texto = encodeURIComponent(
    `¡Hola! 🎂 Me gustaría encargar *${nombreProducto}*. ¿Podrían darme más información sobre disponibilidad y formas de pago?`
  );
  return `https://wa.me/${numero}?text=${texto}`;
}

const CAKE_EMOJIS = ['🎂', '🍰', '🧁', '🥧', '🍮', '🎁', '🌸', '✨'];

interface ProductoConPrecio extends Receta {
  precioVenta: number;
  precioVentaPorUnidad: number;  // precioVenta / rinde_porciones
  emoji: string;
}

// Defaults para cuando la config todavía está cargando.
// Sin anotación de tipo explícita — TS infiere los valores como string/number concretos,
// no como string | undefined (que heredaría de los campos opcionales de Configuracion).
const CONFIG_DEFAULT = {
  whatsapp_numero:      '5493512476048',
  whatsapp_numero_2:    '5493512217870',
  nombre_contacto_1:    'Belu',
  nombre_contacto_2:    'Flor',
  instagram_url:        '',
  instagram_usuario:    '@midulce_tentacion7',
  instagram_destacados: [] as string[],
  valor_hora_trabajo:   500,
  costo_fijo_por_hora:  100,
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [productos, setProductos] = useState<ProductoConPrecio[]>([]);
  const [promos,    setPromos]    = useState<Promocion[]>([]);
  const [config,    setConfig]    = useState(CONFIG_DEFAULT);

  // Un solo useEffect carga todo en paralelo
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ingredientes, recetas, allLineas, cfg, promoActivas] = await Promise.all([
          ingredientesService.getAll(),
          recetasService.getAll(),
          recetasService.getAllLineas(),
          configuracionService.get(),
          promocionesService.getActivas(),
        ]);
        if (cancelled) return;

        setConfig({
          whatsapp_numero:      cfg.whatsapp_numero      ?? CONFIG_DEFAULT.whatsapp_numero,
          whatsapp_numero_2:    cfg.whatsapp_numero_2    ?? CONFIG_DEFAULT.whatsapp_numero_2,
          nombre_contacto_1:    cfg.nombre_contacto_1    ?? CONFIG_DEFAULT.nombre_contacto_1,
          nombre_contacto_2:    cfg.nombre_contacto_2    ?? CONFIG_DEFAULT.nombre_contacto_2,
          instagram_url:        cfg.instagram_url        ?? '',
          instagram_usuario:    cfg.instagram_usuario    ?? CONFIG_DEFAULT.instagram_usuario,
          instagram_destacados: cfg.instagram_destacados ?? [],
          valor_hora_trabajo:   cfg.valor_hora_trabajo,
          costo_fijo_por_hora:  cfg.costo_fijo_por_hora,
        });

        const ingMap = Object.fromEntries(ingredientes.map(i => [i.id, i]));
        const visibles = recetas.filter(r => r.visible_en_catalogo !== false);

        const lista: ProductoConPrecio[] = visibles.map((receta, idx) => {
          const lineas  = allLineas.filter(l => l.receta_id === receta.id);
          const costoIng = lineas.reduce((s, li) => {
            const ing = ingMap[li.ingrediente_id];
            return ing ? s + calcCostoLinea(li, ing) : s;
          }, 0);
          const h = receta.tiempo_prep_minutos / 60;
          const costoTotal = costoIng
            + h * cfg.valor_hora_trabajo
            + h * cfg.costo_fijo_por_hora
            + receta.costo_packaging_fijo;
          const precioVenta = costoTotal * (1 + receta.margen_ganancia_porcentaje / 100);
          const precioVentaPorUnidad = precioVenta / (receta.rinde_porciones || 1);
          return { ...receta, precioVenta, precioVentaPorUnidad, emoji: CAKE_EMOJIS[idx % CAKE_EMOJIS.length] };
        });

        setProductos(lista);
        setPromos(promoActivas);
      } catch (err) {
        console.error('[LandingPage] Error cargando datos:', err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const whatsappNumero = config.whatsapp_numero;

  return (
    <div className="min-h-screen bg-amber-50/30 font-sans antialiased">

      {/* ── Navbar flotante ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Dulce Tentación"
              className="h-9 w-9 object-contain rounded-xl"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-none">
              <p className="text-[9px] text-rose-400 font-bold tracking-widest uppercase">Repostería & Cotillón</p>
              <span className="font-extrabold text-stone-800 text-sm lg:text-base">Dulce Tentación</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#catalogo" className="hidden lg:inline text-sm font-semibold text-stone-500 hover:text-rose-500 transition-colors">
              Menú
            </a>
            <a href="#contacto" className="hidden lg:inline text-sm font-semibold text-stone-500 hover:text-rose-500 transition-colors">
              Contacto
            </a>
            <a
              href={`https://wa.me/${whatsappNumero}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3.5 py-2 rounded-full transition-all duration-200 shadow-sm shadow-green-200/80"
            >
              <WhatsAppIcon size={12} /> WhatsApp
            </a>
            <Link to="/login" className="text-xs text-stone-400 hover:text-rose-500 transition-colors px-1 py-2">
              Panel →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-10 pb-20 px-5 lg:pt-24 lg:pb-32"
        style={{ background: 'radial-gradient(ellipse at top, rgba(254,205,211,0.35) 0%, rgba(255,237,213,0.2) 50%, rgba(255,251,235,0.1) 100%), #fffbf0' }}
      >
        {/* Manchas decorativas difusas */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-rose-200/25 blur-3xl" />
          <div className="absolute top-1/3 -left-16 w-56 h-56 rounded-full bg-amber-200/25 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-pink-100/30 blur-2xl" />
        </div>

        {/* En mobile: columna centrada. En desktop: 2 columnas — texto izq, logo der */}
        <div className="relative max-w-sm mx-auto text-center lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:text-left">

          {/* Logo — en mobile arriba, en desktop columna derecha */}
          <div className="relative inline-block mb-6 lg:mb-0 lg:order-2 lg:flex lg:justify-center lg:items-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-200/40 to-amber-100/40 blur-2xl scale-110" />
            <img
              src="/logo.png"
              alt="Dulce Tentación"
              className="relative w-52 h-52 lg:w-80 lg:h-80 object-contain drop-shadow-[0_20px_40px_rgba(244,63,94,0.18)]"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Texto — en mobile abajo, en desktop columna izquierda */}
          <div className="lg:order-1">
            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-500 text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide shadow-sm shadow-rose-100">
              <Star size={9} fill="currentColor" /> Córdoba · Artesanal · A pedido
            </span>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-stone-800 tracking-tight leading-[1.1] mb-4">
              Endulzamos<br />
              <span className="text-rose-500">cada momento</span>
            </h1>

            <p className="text-stone-500 text-[15px] lg:text-base leading-relaxed mb-8 max-w-[260px] mx-auto lg:mx-0 lg:max-w-sm">
              Tortas, alfajores y delicias artesanales hechas con amor y los mejores ingredientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href="#catalogo"
                className="inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm py-3.5 px-7 rounded-full transition-all duration-300 shadow-lg shadow-rose-300/50 hover:shadow-rose-400/60 hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingBag size={15} /> Ver menú
              </a>
              <a
                href={`https://wa.me/${whatsappNumero}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-stone-700 font-bold text-sm py-3.5 px-7 rounded-full transition-all duration-300 border border-stone-200/80 shadow-sm hover:-translate-y-0.5 backdrop-blur-sm"
              >
                <WhatsAppIcon size={15} /> Pedir ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promociones Especiales ───────────────────────────────────────────── */}
      {promos.length > 0 && (
        <section className="py-10 px-5 bg-gradient-to-b from-amber-50/60 to-rose-50/30">
          <div className="max-w-sm mx-auto lg:max-w-5xl">

            {/* Header sección */}
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center justify-center w-8 h-8 bg-rose-500 rounded-xl shadow-sm shadow-rose-200">
                <Flame size={15} className="text-white" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-stone-800 tracking-tight leading-none">
                  Promociones Especiales
                </h2>
                <p className="text-[11px] text-stone-400 mt-0.5">Ofertas por tiempo limitado 🎉</p>
              </div>
            </div>

            {/* Cards de promos — 1 col mobile, 2-3 col desktop */}
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
              {promos.map(promo => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  whatsappNumero={whatsappNumero}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Servicios + Horarios ─────────────────────────────────────────────── */}
      <section className="py-8 px-5">
        <div className="max-w-sm mx-auto lg:max-w-3xl space-y-3">

          {/* Tiles de servicios reales */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            {[
              {
                icon: '🎂',
                label: 'Tortas & postres',
                sub: 'A pedido o listos para llevar',
                from: 'from-rose-50', to: 'to-pink-50/80',
                border: 'border-rose-100/70',
              },
              {
                icon: '🍬',
                label: 'Mesas dulces',
                sub: 'Para eventos y celebraciones',
                from: 'from-amber-50', to: 'to-orange-50/80',
                border: 'border-amber-100/70',
              },
              {
                icon: '📍',
                label: 'Retiro en local',
                sub: 'Cañuelas 1719 · Villa Revol',
                from: 'from-violet-50', to: 'to-purple-50/80',
                border: 'border-violet-100/60',
              },
            ].map(({ icon, label, sub, from, to, border }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-2 bg-gradient-to-b ${from} ${to} py-5 px-2 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] border ${border} lg:py-7 lg:px-4 lg:gap-3`}
              >
                <span className="text-2xl lg:text-4xl">{icon}</span>
                <div className="text-center">
                  <p className="text-[10px] lg:text-xs text-stone-700 font-bold leading-tight">{label}</p>
                  <p className="text-[9px] lg:text-[10px] text-stone-400 font-medium mt-0.5 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>


        </div>
      </section>

      {/* ── Catálogo ─────────────────────────────────────────────────────────── */}
      <section id="catalogo" className="py-6 px-5 pb-16">
        <div className="max-w-sm mx-auto lg:max-w-5xl">

          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-amber-100/80 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide">
              <Sparkles size={11} /> Nuestras creaciones
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-stone-800 tracking-tight">Elaborado a pedido</h2>
            <p className="text-sm text-stone-400 mt-1.5">Con ingredientes frescos y mucho amor 🩷</p>
          </div>

          {productos.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-12 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl">🎂</span>
              </div>
              <p className="text-stone-600 font-semibold mb-1">El menú se está preparando…</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Muy pronto vas a poder ver<br />todas nuestras delicias acá.
              </p>
            </div>
          ) : (
            /* Mobile: columna · Desktop: grilla 2 col */
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5">
              {productos.map(p => (
                <ProductCard key={p.id} producto={p} whatsappNumero={whatsappNumero} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contacto ─────────────────────────────────────────────────────────── */}
      <section id="contacto" className="px-5 pb-16">
        <div className="max-w-sm mx-auto lg:max-w-2xl">

          {/* Header — mismo estilo que el resto de secciones */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-rose-100/80 text-rose-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide shadow-sm shadow-rose-100">
              💬 Contacto directo
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-stone-800 tracking-tight">
              ¿Tenés alguna consulta?
            </h2>
            <p className="text-sm text-stone-400 mt-2 leading-relaxed">
              Escribinos por WhatsApp y coordinamos tu encargo personalizado.
            </p>
          </div>

          {/* Cards de contacto — 1 col mobile, 2 col sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <a
              href={`https://wa.me/${config.whatsapp_numero ?? '5493512476048'}`}
              target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.06)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0,0,0,0.10)] hover:border-rose-100/70"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-[0_4px_12px_rgba(244,63,94,0.28)] shrink-0">
                {(config.nombre_contacto_1 ?? 'B').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-800 text-sm leading-tight">
                  {config.nombre_contacto_1 ?? 'Belu'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">Escribir por WhatsApp →</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0 group-hover:bg-green-500 group-hover:text-white transition-all duration-200 shadow-sm">
                <WhatsAppIcon size={16} />
              </div>
            </a>

            {config.whatsapp_numero_2 && (
              <a
                href={`https://wa.me/${config.whatsapp_numero_2}`}
                target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.06)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0,0,0,0.10)] hover:border-rose-100/70"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-[0_4px_12px_rgba(244,63,94,0.28)] shrink-0">
                  {(config.nombre_contacto_2 ?? 'F').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-800 text-sm leading-tight">
                    {config.nombre_contacto_2 ?? 'Flor'}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">Escribir por WhatsApp →</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0 group-hover:bg-green-500 group-hover:text-white transition-all duration-200 shadow-sm">
                  <WhatsAppIcon size={16} />
                </div>
              </a>
            )}
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <span className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Respondemos rápido
            </span>
            <span className="text-stone-200">·</span>
            <span className="text-xs text-stone-400 font-medium">Pedidos personalizados</span>
          </div>

        </div>
      </section>

      {/* ── Instagram ────────────────────────────────────────────────────────── */}
      {config.instagram_url && (
        <section className="px-5 pb-14">
          <div className="max-w-sm mx-auto lg:max-w-5xl lg:grid lg:grid-cols-[1fr_auto] lg:gap-10 lg:items-start">

            {/* Card principal con gradiente IG muy suave */}
            <div
              className="rounded-3xl p-6 mb-5 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(240,148,51,0.08) 0%, rgba(220,39,67,0.08) 50%, rgba(188,24,136,0.08) 100%)', border: '1px solid rgba(220,39,67,0.12)' }}
            >
              {/* Ícono IG */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
              >
                <Instagram size={26} className="text-white" />
              </div>

              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Seguinos en</p>
              <h2 className="text-xl font-extrabold text-stone-800 tracking-tight mb-1">
                {config.instagram_usuario ?? '@midulce_tentacion7'}
              </h2>
              <p className="text-sm text-stone-500 mb-5">
                Dulces, flyers y novedades todos los días 🍰✨
              </p>

              <a
                href={config.instagram_url}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white font-bold text-sm py-3 px-7 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
              >
                <Instagram size={16} /> Seguir en Instagram
              </a>
            </div>

            {/* Grilla de destacados con preview real via Microlink */}
            {(config.instagram_destacados ?? []).some(u => u?.trim()) && (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => {
                  const url = config.instagram_destacados?.[i]?.trim();
                  if (!url) return null;
                  return <IgPostCard key={i} url={url} />;
                })}
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── Footer premium ───────────────────────────────────────────── */}
      <footer className="bg-gradient-to-br from-stone-900 via-stone-900 to-rose-950 pt-12 pb-8 px-5">
        <div className="max-w-sm mx-auto lg:max-w-5xl">

          {/* Grid: 1 col mobile → 3 cols desktop */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-16 mb-10">

            {/* Col 1: Marca */}
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-3 justify-center lg:justify-start mb-4">
                <img
                  src="/logo.png"
                  alt="Dulce Tentación"
                  className="h-10 w-10 object-contain rounded-xl opacity-95"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <p className="text-[9px] text-rose-400 font-bold tracking-widest uppercase leading-none mb-0.5">
                    Repostería & Cotillón
                  </p>
                  <p className="font-extrabold text-white text-sm tracking-tight">Dulce Tentación</p>
                </div>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed max-w-[200px] mx-auto lg:mx-0">
                Tortas, postres y delicias artesanales hechas con amor en Córdoba.
              </p>
              <div className="flex items-center gap-2 justify-center lg:justify-start mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-xs text-stone-600 font-medium">Córdoba, Argentina</span>
              </div>
            </div>

            {/* Col 2: Horarios — destacados en amber */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-5">
                <div className="w-5 h-5 rounded-md bg-amber-400/15 flex items-center justify-center shrink-0">
                  <span className="text-amber-400 text-[11px] leading-none">⏰</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                  Horarios de atención
                </p>
              </div>
              <div className="space-y-3.5">
                <div className="flex items-baseline justify-between lg:justify-start lg:gap-6 border-b border-white/5 pb-3.5">
                  <p className="text-xs font-bold text-white/75 w-16 shrink-0 text-left">Lun – Vie</p>
                  <p className="text-xs text-stone-400 text-right lg:text-left">10:00 – 13:00 &nbsp;·&nbsp; 17:30 – 20:30</p>
                </div>
                <div className="flex items-baseline justify-between lg:justify-start lg:gap-6 border-b border-white/5 pb-3.5">
                  <p className="text-xs font-bold text-white/75 w-16 shrink-0 text-left">Sábados</p>
                  <p className="text-xs text-stone-400 text-right lg:text-left">10:00 – 20:00 <span className="text-stone-600 text-[10px]">(corrido)</span></p>
                </div>
                <div className="flex items-baseline justify-between lg:justify-start lg:gap-6">
                  <p className="text-xs font-bold text-white/75 w-16 shrink-0 text-left">Domingos</p>
                  <p className="text-xs text-stone-400 text-right lg:text-left">Desde las 16:00 hs</p>
                </div>
              </div>
            </div>

            {/* Col 3: Contacto */}
            <div className="text-center lg:text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 mb-5">Contacto</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-[0_2px_8px_rgba(244,63,94,0.3)]">
                    B
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white/70 leading-none">Belu</p>
                    <p className="text-xs text-stone-500 mt-0.5">351 247‑6048</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-[0_2px_8px_rgba(244,63,94,0.3)]">
                    F
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white/70 leading-none">Flor</p>
                    <p className="text-xs text-stone-500 mt-0.5">351 221‑7870</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-center lg:justify-start pt-1">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                    <span className="text-violet-400 text-[13px]">📍</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-stone-600 uppercase tracking-wide leading-none mb-0.5">Retiro en local</p>
                    <p className="text-xs text-stone-500">Cañuelas 1719 · Villa Revol</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Divider + copyright */}
          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-stone-700 text-center flex items-center gap-1">
              Hecho con <Heart size={10} className="text-rose-500 mx-0.5" /> y los mejores ingredientes
            </p>
            <p className="text-[10px] text-stone-700 font-mono">
              © {new Date().getFullYear()} Dulce Tentación
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}

// ── IgPostCard (preview real via Microlink API) ───────────────────────────────
function IgPostCard({ url }: { url: string }) {
  const [imgSrc, setImgSrc]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(false);
    setImgSrc(null);

    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then((data) => {
        const image = data?.data?.image?.url as string | undefined;
        if (image) {
          setImgSrc(image);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgb(0,0,0,0.07)] border border-stone-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0,0,0,0.12)]"
    >
      <div className="aspect-square relative overflow-hidden bg-stone-50">

        {/* Skeleton mientras carga */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(240,148,51,0.08), rgba(220,39,67,0.08), rgba(188,24,136,0.08))' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}>
              <Instagram size={16} className="text-white" />
            </div>
          </div>
        )}

        {/* Thumbnail real */}
        {!loading && imgSrc && (
          <img
            src={imgSrc}
            alt="Post de Instagram"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Fallback gradiente si falla la API */}
        {!loading && (error || !imgSrc) && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, rgba(240,148,51,0.15), rgba(220,39,67,0.15), rgba(188,24,136,0.15))' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}>
              <Instagram size={16} className="text-white" />
            </div>
          </div>
        )}

        {/* Ícono external link al hover */}
        <ExternalLink
          size={10}
          className="absolute bottom-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
        />
      </div>
      <div className="px-2 py-2 text-center">
        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide leading-tight">
          Ver post
        </p>
      </div>
    </a>
  );
}

// ── PromoCard (Landing) ───────────────────────────────────────────────────────
function PromoCard({ promo, whatsappNumero }: { promo: Promocion; whatsappNumero: string }) {
  const texto = encodeURIComponent(
    `¡Hola! 🎉 Vi la promo de *${promo.titulo}* y me gustaría pedirla. ¿Está disponible?`
  );
  const waUrl = `https://wa.me/${whatsappNumero}?text=${texto}`;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)]">

      {/* Imagen protagonista */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-rose-50 to-amber-50">
        <img
          src={promo.imagen_url}
          alt={promo.titulo}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Badge "Promo" */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md shadow-rose-300/50 tracking-wide uppercase">
            <Flame size={9} /> Promo
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-extrabold text-stone-800 text-lg tracking-tight leading-tight mb-1">
          {promo.titulo}
        </h3>
        {promo.descripcion && (
          <p className="text-sm text-stone-400 mb-3 leading-relaxed">{promo.descripcion}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold mb-0.5 flex items-center gap-1">
              <Tag size={8} /> Precio especial
            </p>
            <p className="text-2xl font-extrabold text-rose-500 tracking-tight">
              {formatARS(promo.precio_promocional)}
            </p>
          </div>

          <a
            href={waUrl}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-extrabold text-sm py-3 px-5 rounded-2xl transition-all duration-200 shadow-md shadow-green-200/80 hover:-translate-y-0.5 hover:shadow-green-300/80"
          >
            <WhatsAppIcon size={16} />
            <span>¡La quiero!</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ producto, whatsappNumero }: {
  producto: ProductoConPrecio;
  whatsappNumero: string;
}) {
  const whatsappUrl = buildWhatsAppLink(whatsappNumero, producto.nombre);

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] overflow-hidden flex lg:flex-col transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.09)] hover:border-rose-100/50">

      {/* Imagen / placeholder — horizontal en mobile, banner arriba en desktop */}
      <div className="w-28 shrink-0 lg:w-full lg:h-48 bg-gradient-to-br from-rose-50 to-amber-50/80 flex items-center justify-center overflow-hidden">
        {producto.image_url ? (
          <img
            src={producto.image_url}
                alt={producto.nombre}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-4xl lg:text-6xl transition-transform duration-300 group-hover:scale-110 select-none">
            {producto.emoji}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-extrabold text-stone-800 text-[15px] lg:text-base tracking-tight leading-tight mb-1.5 truncate">
            {producto.nombre}
          </h3>
          <div className="flex items-center gap-2.5 text-xs text-stone-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={9} /> {producto.tiempo_prep_minutos} min
            </span>
            <span>·</span>
            <span>{producto.rinde_porciones} {producto.modo_venta === 'por_unidad' ? 'unidades' : 'porciones'}</span>
          </div>
          {producto.notas && (
            <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{producto.notas}</p>
          )}
        </div>

        <div className="flex items-end justify-between mt-3 gap-2">
          <div>
            {producto.modo_venta === 'por_unidad' ? (
              <>
                <p className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold mb-0.5">Por unidad</p>
                <p className="text-lg font-extrabold text-rose-500 tracking-tight leading-none">
                  {formatARS(producto.precioVentaPorUnidad)}
                </p>
                <p className="text-[9px] text-stone-300 mt-0.5">
                  x {producto.rinde_porciones} = {formatARS(producto.precioVenta)}
                </p>
              </>
            ) : (
              <>
                <p className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold mb-0.5">Precio</p>
                <p className="text-lg font-extrabold text-rose-500 tracking-tight leading-none">
                  {formatARS(producto.precioVenta)}
                </p>
              </>
            )}
          </div>
          <a
            href={whatsappUrl}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3.5 py-2 rounded-full transition-all duration-200 shadow-sm shadow-green-200/70 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <WhatsAppIcon size={12} /> Pedir
          </a>
        </div>
      </div>
    </div>
  );
}
