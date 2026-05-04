# 📖 Guía de Uso: Panel de Administración Bootie

## 🎯 Acceso Rápido

**URL:** http://localhost:3000/admin  
**Usuario:** admin  
**Contraseña:** bootie2026

---

## 🚀 Subir Documentos de Nómina

### Método 1: Arrastar y Soltar
1. Abre http://localhost:3000/admin en tu navegador
2. Inicia sesión con las credenciales arriba
3. Arrastra tu archivo `nomina-marzo-abril-2026.pptx` (o DOCX, PDF)
4. Suéltalo en la zona con icono 📁
5. Espera el mensaje "✅ Archivo procesado exitosamente"
6. ¡Listo! El chatbot ya puede responder sobre marzo-abril

### Método 2: Clic para Seleccionar
1. Accede a http://localhost:3000/admin
2. Haz clic en la zona de upload
3. Selecciona tu archivo
4. El sistema lo procesará automáticamente

---

## 📂 Formatos Soportados

| Formato | Extensión | Notas |
|---------|-----------|-------|
| PowerPoint | .pptx, .ppt | Conversión automática |
| Word | .docx, .doc | **Recomendado** para mejor conversión |
| PDF | .pdf | Extrae texto automáticamente |
| Texto | .txt | Copia directa |
| Markdown | .md | Copia directa |

**Tamaño máximo:** 10MB por archivo

---

## ⚠️ Nota sobre PPTX

Si tu archivo PPTX no se convierte bien:

1. Abre el PPTX en PowerPoint
2. **Archivo** → **Guardar como**
3. Formato: **Documento de Word (.docx)**
4. Guarda el nuevo archivo
5. Sube el `.docx` en vez del `.pptx`

Esto garantiza mejor calidad en la conversión.

---

## 🧹 Eliminar Documentos Viejos

1. Ve a la sección "Documentos Actuales"
2. Encuentra el documento que deseas eliminar
3. Haz clic en el botón rojo **"Eliminar"**
4. Confirma la acción
5. La base de conocimientos se actualiza automáticamente

---

## 🔄 Regenerar Manualmente

Si necesitas forzar una regeneración de `knowledge-base.json`:

1. Haz clic en el botón **"🔄 Regenerar KB"**
2. Espera confirmación
3. La base se reconstruye desde todos los archivos .md

---

## 🔒 Cambiar Contraseña

Edita el archivo `.env.local`:

```env
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD=tu_nueva_contraseña
```

Reinicia el servidor:
```bash
npm run dev
```

---

## ✅ Verificación

Después de subir un documento, verifica que Bootie puede usarlo:

1. Abre http://localhost:3000 (página principal)
2. Abre el chat de Bootie (botón flotante)
3. Pregunta: **"¿Cuándo pagan en marzo?"**
4. Bootie debería responder con información de tu nuevo documento

---

**¿Problemas?** Revisa [`walkthrough.md`](file:///C:/Users/lf/.gemini/antigravity/brain/b60da79c-7dee-49b5-8e5c-f464e2836193/walkthrough.md) para guía completa.
