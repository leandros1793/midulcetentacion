import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Clock, Heart, MessageCircle } from 'lucide-react';
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

// ── Placeholders por categoría de producto ────────────────────────────────────
const CAKE_EMOJIS = ['🎂', '🍰', '🧁', '🥧', '🍮', '🎁', '🌸', '✨'];

interface ProductoConPrecio extends Receta {
  precioVenta: number;
  emoji: string;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function LandingPage() {
  const [productos, setProductos] = useState<ProductoConPrecio[]>([]);
  const whatsappNumero = useMemo(() => configuracionService.get().whatsapp_numero ?? '5493512000000', []);

  useEffect(() => {
    const ingredientes  = ingredientesService.getAll();
    const config        = configuracionService.get();
    const recetas       = recetasService.getAll().filter(r => r.visible_en_catalogo !== false);

    const lista: ProductoConPrecio[] = recetas.map((receta, idx) => {
      const lineas = recetasService.getLineas(receta.id);
      const costoIng = lineas.reduce((s, li) => {
        const ing = ingredientes.find(i => i.id === li.ingrediente_id);
        return ing ? s + calcCostoLinea(li, ing) : s;
      }, 0);
      const h = receta.tiempo_prep_minutos / 60;
      const costoTotal = costoIng + h * config.valor_hora_trabajo + h * config.costo_fijo_por_hora + receta.costo_packaging_fijo;
      const precioVenta = costoTotal * (1 + receta.margen_ganancia_porcentaje / 100);
      return { ...receta, precioVenta, emoji: CAKE_EMOJIS[idx % CAKE_EMOJIS.length] };
    });

    setProductos(lista);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="h-9 w-9 object-contain rounded-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="font-bold text-gray-800 text-sm">Dulce Tentación</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${whatsappNumero}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
          <Link to="/login" className="text-xs text-gray-400 hover:text-rose-500 transition-colors px-2">
            Panel →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-blush-50 to-cream-50 pt-14 pb-20 px-4">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute top-6 right-8 text-7xl opacity-10 rotate-12 select-none">🎂</span>
          <span className="absolute bottom-8 left-6 text-6xl opacity-10 -rotate-12 select-none">🌸</span>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5 select-none">✨</span>
        </div>

        <div className="relative max-w-md mx-auto text-center">
          {/* Logo principal */}
          <img
            src="/logo.png"
            alt="Dulce Tentación"
            className="w-52 h-52 object-contain mx-auto mb-4 drop-shadow-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Star size={11} fill="currentColor" /> Repostería &amp; Cotillón · Córdoba
          </span>
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">
            Endulzamos<br />
            <span className="text-rose-500">cada momento</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-xs mx-auto">
            Tortas, cheesecakes y delicias artesanales hechas con amor y los mejores ingredientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#catalogo" className="btn-primary text-base py-3 px-6 justify-center rounded-2xl shadow-lg shadow-rose-200">
              <ShoppingBag size={18} /> Ver menú completo
            </a>
            <a
              href={`https://wa.me/${whatsappNumero}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium text-base py-3 px-6 rounded-2xl transition-colors justify-center"
            >
              <Phone size={18} /> Pedir ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── Propuesta de valor ────────────────────────────────────────────────── */}
      <section className="bg-white py-10 px-4">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '🌿', label: 'Ingredientes naturales' },
            { emoji: '🎨', label: 'Diseños únicos' },
            { emoji: '🚀', label: 'Entrega a domicilio' },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catálogo ─────────────────────────────────────────────────────────── */}
      <section id="catalogo" className="bg-warm-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-800 mb-2">Nuestras creaciones</h2>
            <p className="text-sm text-gray-400">Cada producto es elaborado a pedido con ingredientes frescos</p>
          </div>

          {productos.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🎂</span>
              <p className="text-gray-400">El menú se está preparando…</p>
              <p className="text-xs text-gray-300 mt-1">Agregá recetas desde el panel para que aparezcan aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {productos.map(p => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  whatsappNumero={whatsappNumero}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA WhatsApp final ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-green-500 to-emerald-600 py-12 px-4 text-white text-center">
        <div className="max-w-sm mx-auto">
          <span className="text-4xl mb-4 block">💬</span>
          <h2 className="text-xl font-bold mb-2">¿Tenés alguna consulta?</h2>
          <p className="text-green-100 text-sm mb-6">
            Escribinos por WhatsApp y te respondemos a la brevedad. Hacemos pedidos personalizados.
          </p>
          <a
            href={`https://wa.me/${whatsappNumero}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-600 font-bold py-3 px-8 rounded-2xl hover:bg-green-50 transition-colors"
          >
            <MessageCircle size={20} /> Escribir por WhatsApp
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={12} className="text-rose-400" />
          <span className="text-xs">Hecho con amor · Mi Dulce Tentación · Córdoba, Argentina</span>
        </div>
        <p className="text-xs text-gray-600">Pastelería artesanal a pedido</p>
      </footer>
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
    <div className="bg-white rounded-3xl shadow-sm border border-warm-100 overflow-hidden flex gap-0">
      {/* Imagen / placeholder */}
      <div className="w-28 shrink-0 bg-gradient-to-br from-rose-50 to-blush-100 flex items-center justify-center">
        {producto.image_url ? (
          <img
            src={producto.image_url}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{producto.emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">{producto.nombre}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {producto.tiempo_prep_minutos} min
            </span>
            <span>· {producto.rinde_porciones} porciones</span>
          </div>
          {producto.notas && (
            <p className="text-xs text-gray-400 line-clamp-2">{producto.notas}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xs text-gray-400">Precio</p>
            <p className="text-lg font-black text-rose-600">{formatARS(producto.precioVenta)}</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <MessageCircle size={13} /> Pedir
          </a>
        </div>
      </div>
    </div>
  );
}
