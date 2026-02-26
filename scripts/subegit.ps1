# subegit.ps1 - Sube todos los cambios a GitHub automaticamente

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm"
$mensaje = if ($args[0]) { $args[0] } else { "Actualizacion KB: $fecha" }

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Subiendo cambios a GitHub..." -ForegroundColor Cyan
Write-Host "  Mensaje: $mensaje" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Agregar todos los cambios
Write-Host "[1/3] Agregando archivos..." -ForegroundColor White
git add -A
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en git add" -ForegroundColor Red; exit 1 }

# Verificar si hay algo que commitear
$status = git status --porcelain
if (-not $status) {
    Write-Host ""
    Write-Host "No hay cambios nuevos para subir." -ForegroundColor Yellow
    exit 0
}

# 2. Commit
Write-Host "[2/3] Haciendo commit..." -ForegroundColor White
git commit -m $mensaje
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en git commit" -ForegroundColor Red; exit 1 }

# 3. Push
Write-Host "[3/3] Subiendo a GitHub..." -ForegroundColor White
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en git push" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  LISTO! Cambios subidos a GitHub." -ForegroundColor Green
Write-Host "  Vercel desplegara automaticamente." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
