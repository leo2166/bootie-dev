# 🚀 Guía de Integración: Bootie Widget en InfoDoc

## 📍 Comportamiento del Widget

**Bootie aparece ÚNICAMENTE en la página principal (`/`) de InfoDoc.**

- ✅ Ruta `/` → Widget visible
- ❌ Rutas `/usuarios`, `/reportes`, `/cualquier-otra` → Widget oculto

## 🔧 Instrucciones de Integración

### 1. Copiar el Widget

Copia el archivo `bootie-widget.tsx` al proyecto InfoDoc:

```bash
# Desde el directorio de InfoDoc
cp ../bootie-dev/components/bootie-widget.tsx ./components/
```

### 2. Copiar Assets

Copia el avatar de Bootie:

```bash
cp ../bootie-dev/public/bootieFgris.png ./public/
```

### 3. Integrar en Layout o Home

**Opción A: En el Layout Principal** (recomendado)

```tsx
// app/layout.tsx o pages/_app.tsx
import BootieWidget from '@/components/bootie-widget';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BootieWidget />  {/* Auto-detecta ruta, solo aparece en '/' */}
      </body>
    </html>
  );
}
```

**Opción B: Solo en Home Page**

```tsx
// app/page.tsx (Next.js 13+)
import BootieWidget from '@/components/bootie-widget';

export default function HomePage() {
  return (
    <div>
      <h1>Bienvenido a InfoDoc</h1>
      {/* ... contenido ... */}
      <BootieWidget />
    </div>
  );
}
```

### 4. Configurar Variables de Entorno

En InfoDoc, NO necesitas configurar API keys. El widget se conecta al backend de Bootie:

```env
# .env.local (InfoDoc)
# No necesita configuración, usa endpoint por defecto /api/chat
```

Si Bootie está en un servidor separado:

```env
NEXT_PUBLIC_BOOTIE_API_URL=https://bootie.tudominio.com/api/chat
```

Y modifica el widget:

```tsx
// En bootie-widget.tsx, línea 65
const apiUrl = process.env.NEXT_PUBLIC_BOOTIE_API_URL || '/api/chat';
const response = await fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: input }),
});
```

### 5. Instalar Dependencias

```bash
npm install react-markdown rehype-raw
```

## 🎯 Lógica Implementada

El widget usa `usePathname()` de Next.js para detectar la ruta actual:

```tsx
const pathname = usePathname();

// Solo renderiza si está en home
if (pathname !== '/') {
  return null;
}
```

## ✅ Verificación

1. Navega a `http://localhost:3000/` → Bootie debe aparecer
2. Navega a `http://localhost:3000/usuarios` → Bootie debe desaparecer
3. Regresa a `/` → Bootie vuelve a aparecer

## 🔗 CORS (Solo si Bootie está en servidor separado)

El backend de Bootie ya tiene CORS habilitado (`Access-Control-Allow-Origin: *`), por lo que InfoDoc puede conectarse sin problemas.

## 📝 Notas

- **Base de conocimientos limitada**: Bootie está diseñado para soporte en la landing page
- **Performance**: El widget solo se monta en home, no consume recursos en otras rutas
- **Mobile responsive**: El widget se adapta automáticamente a dispositivos móviles

---

**¿Dudas?** Revisa `BOOTIE_MEMORY.md` para detalles técnicos del backend.
