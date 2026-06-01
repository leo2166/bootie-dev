# Instrucciones del Proyecto - Bootie Dev

## Flujo de Despliegue (Git)
- El panel administrativo utiliza `app/api/admin/deploy/route.ts` para sincronizar cambios con GitHub.
- **Robustez en Windows:**
    - Se debe usar `git status --porcelain` para detectar cambios de forma independiente al idioma del sistema.
    - Se utiliza `git add -A` para asegurar que todos los archivos (documentos, imágenes en `public/`, scripts) sean incluidos.
    - Los comandos de Git tienen un timeout de 30 segundos para evitar procesos bloqueados en entornos Windows si fallan las credenciales.
    - El comando de subida debe ser explícito: `git push origin main`.
