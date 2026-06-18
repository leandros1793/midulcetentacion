# Mi Dulce Tentación 🎂 — Sistema de Costeo

## Stack
React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · Lucide Icons · React Router v6 · localStorage

## Arrancar el proyecto

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Levantar servidor de desarrollo
npm run dev

# 3. Abrir en el celular (desde la misma red WiFi)
#    El terminal mostrará una URL del tipo http://192.168.x.x:5173
```

## Módulos implementados

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| **Dashboard** | `/` | KPIs del mes, producto más rentable, acceso rápido |
| **Ingredientes** | `/ingredientes` | CRUD de materia prima con costo por unidad calculado |
| **Recetas / Escandallo** | `/recetas` | Creador de recetas con costeo dinámico en tiempo real |
| **Gastos Generales** | `/gastos` | Registro de gastos fijos y variables por mes |
| **Configuración** | `/configuracion` | Valor hora de trabajo y costo fijo por hora |

## Estructura del proyecto

```
src/
├── types/index.ts          # Modelos de datos + funciones de cálculo
├── services/               # Capa de acceso a datos (localStorage → Supabase-ready)
│   ├── storage.ts          # CRUD genérico
│   ├── ingredientes.ts
│   ├── recetas.ts
│   ├── gastos.ts
│   └── configuracion.ts
├── components/
│   ├── layout/AppShell.tsx # Navegación mobile-first
│   └── ui/                 # Modal, EmptyState, ConfirmDialog
└── pages/
    ├── dashboard/
    ├── ingredientes/
    ├── recetas/             # RecetaBuilder = escandallo + calculadora de precios
    ├── gastos/
    └── configuracion/
```

## Migrar a Supabase

En `src/services/storage.ts`, reemplazá las funciones `get()`/`set()` por llamadas a Supabase. 
El resto del código no necesita cambios.

```typescript
// Ejemplo: reemplazar getAll()
export async function getAll<T>(key: string): Promise<T[]> {
  const { data } = await supabase.from(key).select('*');
  return data ?? [];
}
```
