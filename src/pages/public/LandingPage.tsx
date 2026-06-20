import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Clock, Star, Heart, Sparkles, Truck } from 'lucide-react';
import { ingredientesService, recetasService, configuracionService } from '../../services';
import { calcCostoLinea } from '../../types';
import type { Receta } from '../../types';

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
  const config = useMemo(() => configuracionService.get(), []);
  const whatsappNumero = config.whatsapp_numero ?? '5493512476048';

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
    <div className="min-h-screen bg-stone-50 font-sans antialiased">

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-stone-100 px-5 py-3 flex items-center justify-between shadow-[0_1px_12px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="h-10 w-10 object-contain rounded-2xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <p className="text-[10px] text-rose-400 font-semibold tracking-widest uppercase leading-none">Repostería & Cotillón</p>
            <span className="font-bold text-stone-800 text-sm tracking-tight">Dulce Tentación</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${whatsappNumero}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 shadow-sm shadow-emerald-200"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
          <Link to="/login" className="text-xs text-stone-400 hover:text-rose-500 transition-colors px-2 py-2">
            Panel →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/80 via-orange-50/40 to-stone-50 pt-12 pb-16 px-5">

        {/* Círculos decorativos de fondo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-amber-200/20 blur-3xl" />
        </div>

        <div className="relative max-w-md mx-auto text-center">
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="w-56 h-56 object-contain mx-auto mb-6 drop-shadow-2xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />

          <span className="inline-flex items-center gap-1.5 bg-rose-100/80 text-rose-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
            <Star size={10} fill="currentColor" /> Córdoba · Artesanal · A pedido
          </span>

          <h1 className="text-4xl font-black text-stone-800 tracking-tight leading-[1.1] mb-4">
            Endulzamos<br />
            <span className="text-rose-500">cada momento</span>
          </h1>

          <p className="text-stone-500 text-base leading-relaxed mb-8 max-w-xs mx-auto">
            Tortas, alfajores y delicias artesanales hechas con amor y los mejores ingredientes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#catalogo"
              className="inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm py-3.5 px-7 rounded-full transition-all duration-300 shadow-lg shadow-rose-200/70 hover:shadow-rose-300/80 hover:-translate-y-0.5"
            >
              <ShoppingBag size={16} /> Ver menú
            </a>
            <a
              href={`https://wa.me/${whatsappNumero}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm py-3.5 px-7 rounded-full transition-all duration-300 border border-stone-200 shadow-sm hover:-translate-y-0.5"
            >
              <MessageCircle size={16} className="text-emerald-500" /> Pedir ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── Propuesta de valor ────────────────────────────────────────────────── */}
      <section className="bg-white py-8 px-5 border-y border-stone-100">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          {[
            { icon: '🌿', label: 'Ingredientes naturales' },
            { icon: '✨', label: 'Diseños únicos' },
            { icon: '🛵', label: 'Entrega a domicilio' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl hover:bg-stone-50 transition-colors">
              <span className="text-3xl">{icon}</span>
              <p className="text-xs text-stone-500 font-medium leading-tight text-center">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catálogo ─────────────────────────────────────────────────────────── */}
      <section id="catalogo" className="py-14 px-5">
        <div className="max-w-md mx-auto">

          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide">
              <Sparkles size={11} /> Nuestras creaciones
            </span>
            <h2 className="text-2xl font-black text-stone-800 tracking-tight">Elaborado a pedido</h2>
            <p className="text-sm text-stone-400 mt-1">Con ingredientes frescos y mucho amor</p>
          </div>

          {productos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <span className="text-6xl mb-4 block">🎂</span>
              <p className="text-stone-400 font-medium">El menú se está preparando…</p>
              <p className="text-xs text-stone-300 mt-1">Pronto vas a ver nuestras delicias acá.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {productos.map(p => (
                <ProductCard key={p.id} producto={p} whatsappNumero={whatsappNumero} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Contacto ─────────────────────────────────────────────────────── */}
      <section className="px-5 pb-16">
        <div className="max-w-md mx-auto bg-stone-800 rounded-3xl p-8 text-center shadow-[0_20px_60px_rgb(0,0,0,0.12)]">
          <span className="text-4xl mb-5 block">💌</span>
          <h2 className="text-xl font-black text-white tracking-tight mb-2">¿Tenés alguna consulta?</h2>
          <p className="text-stone-400 text-sm mb-7 leading-relaxed">
            Escribinos por WhatsApp y te respondemos a la brevedad.<br />
            Hacemos pedidos personalizados para cada ocasión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${config.whatsapp_numero ?? '5493512476048'}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-emerald-900/30"
            >
              <MessageCircle size={17} /> {config.nombre_contacto_1 ?? 'Belu'}
            </a>
            {config.whatsapp_numero_2 && (
              <a
                href={`https://wa.me/${config.whatsapp_numero_2}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-emerald-900/30"
              >
                <MessageCircle size={17} /> {config.nombre_contacto_2 ?? 'Flor'}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-100 bg-white py-8 px-5 text-center">
        <img
          src="/logo.png"
          alt="Dulce Tentación"
          className="h-12 w-12 object-contain mx-auto mb-3 opacity-80"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <p className="text-sm font-semibold text-stone-700 tracking-tight">Repostería & Cotillón Dulce Tentación</p>
        <p className="text-xs text-stone-400 mt-1">Córdoba, Argentina · Hecho con <Heart size={10} className="inline text-rose-400" /> y los mejores ingredientes</p>
        <p className="text-xs text-stone-300 mt-2">Belu: 351 247-6048 · Flor: 351 221-7870</p>
      </footer>

    </div>
  );
}

// ── ProductCard Premium ───────────────────────────────────────────────────────

function ProductCard({ producto, whatsappNumero }: {
  producto: ProductoConPrecio;
  whatsappNumero: string;
}) {
  const whatsappUrl = buildWhatsAppLink(whatsappNumero, producto.nombre);

  return (
    <div className="group bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] overflow-hidden flex transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.10)]">

      {/* Imagen / placeholder */}
      <div className="w-32 shrink-0 bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
        {producto.image_url ? (
          <img
            src={producto.image_url}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{producto.emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-bold text-stone-800 text-base tracking-tight leading-tight mb-1.5 truncate">
            {producto.nombre}
          </h3>
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {producto.tiempo_prep_minutos} min
            </span>
            <span className="flex items-center gap-1">
              <Truck size={10} /> {producto.rinde_porciones} porc.
            </span>
          </div>
          {producto.notas && (
            <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{producto.notas}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Precio</p>
            <p className="text-xl font-black text-rose-500 tracking-tight">{formatARS(producto.precioVenta)}</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <MessageCircle size={13} /> Pedir
          </a>
        </div>
      </div>
    </div>
  );
}
