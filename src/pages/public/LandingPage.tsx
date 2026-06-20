import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Star, Heart, Sparkles, Flame, Tag, Instagram, ExternalLink } from 'lucide-react';
import { ingredientesService, recetasService, configuracionService, promocionesService } from '../../services';
import { calcCostoLinea } from '../../types';
import type { Receta, Promocion } from '../../types';

// ── WhatsApp SVG Icon ─────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.001 2C6.479 2 2.001 6.478 2.001 12c0 1.946.537 3.769 1.47 5.33L2 22l4.797-1.438A9.957 9.957 0 0 0 12.001 22c5.522 0 10-4.478 10-10S17.523 2 12.001 2Zm0 18c-1.71 0-3.305-.47-4.67-1.285l-.334-.2-3.464 1.038 1.07-3.36-.218-.346A7.948 7.948 0 0 1 4.001 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8Zm4.39-5.847c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.013-.373-1.93-1.19-.713-.636-1.194-1.422-1.334-1.662-.14-.24-.015-.37.105-.49.108-.107.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.468-.393-.404-.54-.412l-.46-.008c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.693 2.585 4.103 3.623.574.247 1.02.395 1.37.506.576.183 1.1.157 1.514.095.462-.069 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n);
}

function buildWhatsAppLink(numero: string, nombreProducto: string) {
  const texto = encodeURIComponent(
    `¡Hola! 🎂 Me gustaría encargar *${nombreProducto}*. ¿Podrían darme más información sobre disponibilidad y formas de pago?`
  );
  return `https://wa.me/${numero}?text=${texto}`;
}

const CAKE_EMOJIS = ['🎂', '🍰', '🧁', '🥧', '🍮', '🎁', '🌸', '✨'];

interface ProductoConPrecio extends Receta {
  precioVenta: number;
  emoji: string;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [productos, setProductos] = useState<ProductoConPrecio[]>([]);
  const [promos, setPromos]       = useState<Promocion[]>([]);
  const config = useMemo(() => configuracionService.get(), []);
  const whatsappNumero = config.whatsapp_numero ?? '5493512476048';

  useEffect(() => {
    setPromos(promocionesService.getActivas());
  }, []);

  useEffect(() => {
    const ingredientes = ingredientesService.getAll();
    const cfg = configuracionService.get();
    const recetas = recetasService.getAll().filter(r => r.visible_en_catalogo !== false);

    const lista: ProductoConPrecio[] = recetas.map((receta, idx) => {
      const lineas = recetasService.getLineas(receta.id);
      const costoIng = lineas.reduce((s, li) => {
        const ing = ingredientes.find(i => i.id === li.ingrediente_id);
        return ing ? s + calcCostoLinea(li, ing) : s;
      }, 0);
      const h = receta.tiempo_prep_minutos / 60;
      const costoTotal = costoIng + h * cfg.valor_hora_trabajo + h * cfg.costo_fijo_por_hora + receta.costo_packaging_fijo;
      const precioVenta = costoTotal * (1 + receta.margen_ganancia_porcentaje / 100);
      return { ...receta, precioVenta, emoji: CAKE_EMOJIS[idx % CAKE_EMOJIS.length] };
    });

    setProductos(lista);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50/30 font-sans antialiased">

      {/* ── Navbar flotante ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="h-9 w-9 object-contain rounded-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="leading-none">
            <p className="text-[9px] text-rose-400 font-bold tracking-widest uppercase">Repostería & Cotillón</p>
            <span className="font-extrabold text-stone-800 text-sm">Dulce Tentación</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-10 pb-20 px-5"
        style={{ background: 'radial-gradient(ellipse at top, rgba(254,205,211,0.35) 0%, rgba(255,237,213,0.2) 50%, rgba(255,251,235,0.1) 100%), #fffbf0' }}
      >
        {/* Manchas decorativas difusas */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-rose-200/25 blur-3xl" />
          <div className="absolute top-1/3 -left-16 w-56 h-56 rounded-full bg-amber-200/25 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-pink-100/30 blur-2xl" />
        </div>

        <div className="relative max-w-sm mx-auto text-center">

          {/* Logo integrado con anillo decorativo */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-200/40 to-amber-100/40 blur-2xl scale-110" />
            <img
              src="/logo.png"
              alt="Dulce Tentación"
              className="relative w-52 h-52 object-contain drop-shadow-[0_20px_40px_rgba(244,63,94,0.18)]"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-500 text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide shadow-sm shadow-rose-100">
            <Star size={9} fill="currentColor" /> Córdoba · Artesanal · A pedido
          </span>

          <h1 className="text-4xl font-extrabold text-stone-800 tracking-tight leading-[1.1] mb-3">
            Endulzamos<br />
            <span className="text-rose-500">cada momento</span>
          </h1>

          <p className="text-stone-500 text-[15px] leading-relaxed mb-8 max-w-[260px] mx-auto">
            Tortas, alfajores y delicias artesanales hechas con amor y los mejores ingredientes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
      </section>

      {/* ── Promociones Especiales ───────────────────────────────────────────── */}
      {promos.length > 0 && (
        <section className="py-10 px-5 bg-gradient-to-b from-amber-50/60 to-rose-50/30">
          <div className="max-w-sm mx-auto">

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

            {/* Cards de promos */}
            <div className="flex flex-col gap-5">
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

      {/* ── Propuesta de valor ────────────────────────────────────────────────── */}
      <section className="py-10 px-5">
        <div className="max-w-sm mx-auto grid grid-cols-3 gap-3">
          {[
            { icon: '🌿', label: 'Ingredientes naturales' },
            { icon: '✨', label: 'Diseños únicos' },
            { icon: '🛵', label: 'Entrega a domicilio' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm py-5 px-2 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-white"
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-[11px] text-stone-500 font-semibold leading-tight text-center">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catálogo ─────────────────────────────────────────────────────────── */}
      <section id="catalogo" className="py-6 px-5 pb-16">
        <div className="max-w-sm mx-auto">

          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-amber-100/80 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide">
              <Sparkles size={11} /> Nuestras creaciones
            </span>
            <h2 className="text-2xl font-extrabold text-stone-800 tracking-tight">Elaborado a pedido</h2>
            <p className="text-sm text-stone-400 mt-1.5">Con ingredientes frescos y mucho amor 🩷</p>
          </div>

          {productos.length === 0 ? (
            /* Estado vacío elegante */
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
            <div className="flex flex-col gap-4">
              {productos.map(p => (
                <ProductCard key={p.id} producto={p} whatsappNumero={whatsappNumero} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contacto ─────────────────────────────────────────────────────────── */}
      <section className="px-5 pb-16">
        <div className="max-w-sm mx-auto bg-rose-50 rounded-3xl p-8 text-center border border-rose-100/80 shadow-[0_8px_40px_rgb(244,63,94,0.08)]">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm shadow-rose-100">
            <span className="text-2xl">💌</span>
          </div>
          <h2 className="text-xl font-extrabold text-stone-800 tracking-tight mb-2">¿Tenés alguna consulta?</h2>
          <p className="text-stone-500 text-sm mb-7 leading-relaxed max-w-xs mx-auto">
            Escribinos por WhatsApp y te respondemos a la brevedad. Hacemos pedidos personalizados para cada ocasión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${config.whatsapp_numero ?? '5493512476048'}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-7 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-md shadow-green-200 text-sm"
            >
              <WhatsAppIcon size={17} /> {config.nombre_contacto_1 ?? 'Belu'}
            </a>
            {config.whatsapp_numero_2 && (
              <a
                href={`https://wa.me/${config.whatsapp_numero_2}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-7 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-md shadow-green-200 text-sm"
              >
                <WhatsAppIcon size={17} /> {config.nombre_contacto_2 ?? 'Flor'}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Instagram ────────────────────────────────────────────────────────── */}
      {config.instagram_url && (
        <section className="px-5 pb-14">
          <div className="max-w-sm mx-auto">

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

            {/* Grilla de destacados */}
            {(config.instagram_destacados ?? []).some(u => u?.trim()) && (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => {
                  const url = config.instagram_destacados?.[i]?.trim();
                  if (!url) return null;
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgb(0,0,0,0.07)] border border-stone-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0,0,0,0.12)]"
                    >
                      {/* Imagen simulada con gradiente IG */}
                      <div
                        className="aspect-square flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(240,148,51,0.15), rgba(220,39,67,0.15), rgba(188,24,136,0.15))' }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
                        >
                          <Instagram size={16} className="text-white" />
                        </div>
                        <ExternalLink size={10} className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2" />
                      </div>
                      {/* Label */}
                      <div className="px-2 py-2 text-center">
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide leading-tight">
                          Ver post
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-100/80 bg-white/60 backdrop-blur-sm py-10 px-5 text-center">
        <img
          src="/logo.png"
          alt="Dulce Tentación"
          className="h-14 w-14 object-contain mx-auto mb-3"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <p className="text-sm font-bold text-stone-700 tracking-tight">Repostería & Cotillón Dulce Tentación</p>
        <p className="text-xs text-stone-400 mt-1.5">
          Córdoba, Argentina · Hecho con <Heart size={10} className="inline text-rose-400 mx-0.5" /> y los mejores ingredientes
        </p>
        <p className="text-xs text-stone-300 mt-1.5">Belu: 351 247-6048 · Flor: 351 221-7870</p>
      </footer>

    </div>
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
    <div className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] overflow-hidden flex transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.09)] hover:border-rose-100/50">

      {/* Imagen / placeholder */}
      <div className="w-28 shrink-0 bg-gradient-to-br from-rose-50 to-amber-50/80 flex items-center justify-center overflow-hidden">
        {producto.image_url ? (
          <img
            src={producto.image_url}
            alt={producto.nombre}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-4xl transition-transform duration-300 group-hover:scale-110 select-none">
            {producto.emoji}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-extrabold text-stone-800 text-[15px] tracking-tight leading-tight mb-1.5 truncate">
            {producto.nombre}
          </h3>
          <div className="flex items-center gap-2.5 text-xs text-stone-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={9} /> {producto.tiempo_prep_minutos} min
            </span>
            <span>·</span>
            <span>{producto.rinde_porciones} porciones</span>
          </div>
          {producto.notas && (
            <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{producto.notas}</p>
          )}
        </div>

        <div className="flex items-end justify-between mt-3 gap-2">
          <div>
            <p className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold mb-0.5">Precio</p>
            <p className="text-lg font-extrabold text-rose-500 tracking-tight leading-none">
              {formatARS(producto.precioVenta)}
            </p>
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
