# 🤖 Bootie - Asistente Virtual con IA

Prototipo de asistente virtual inteligente usando Google Gemini API y Next.js.

## 🚀 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Edita el archivo `.env.local` y agrega tu API key de Google:

```env
GOOGLE_API_KEY=tu_api_key_aqui
```

**Obtén tu API Key:** [Google AI Studio](https://aistudio.google.com/apikey)

### 3. Agregar Documentos
Crea archivos PDF, TXT o Markdown en la carpeta `documents/`:

```bash
bootie-dev/
  documents/
    - convencion-colectiva.pdf
    - politicas-rrhh.pdf
    - informacion-general.txt
```

### 4. Subir Documentos a Gemini
Ejecuta el script de ingestión:

```bash
npm run ingest
```

Este script subirá tus documentos a la API de Gemini File Search para que Bootie pueda consultarlos.

## 🎮 Uso

### Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Interactuar con Bootie
1. Haz clic en el botón flotante 🤖 en la esquina inferior derecha
2. Escribe tu pregunta
3. Bootie responderá basándose en los documentos subidos

## 📁 Estructura del Proyecto

```
bootie-dev/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Endpoint de API para el chat
│   └── page.tsx                   # Página principal
├── components/
│   └── bootie-widget.tsx          # Widget de chat flotante
├── scripts/
│   └── ingest-documents.ts        # Script para subir documentos
├── documents/                     # Coloca aquí tus documentos
├── .env.local                     # Variables de entorno
└── package.json
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run ingest` - Sube documentos a Gemini File API

## 📝 Notas

- **Modelo usado:** `gemini-2.0-flash-exp`
- **Personalidad:** Bootie es un asistente robótico amigable que usa expresiones como "¡Bip bup!"
- **RAG:** Utiliza Google Gemini File Search para búsqueda semántica en documentos

## 🔮 Próximos Pasos

Una vez que Bootie funcione correctamente en este prototipo, se migrará al proyecto principal `infodoc-cantv`.
