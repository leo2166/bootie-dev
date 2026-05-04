@echo off
title Servidor Bootie Admin
color 0A

echo ===================================================
echo    Iniciando Servidor Local de BOOTIE ADMIN
echo ===================================================
echo.
echo Por favor, manten esta ventana abierta mientras uses el panel.
echo.

:: Cambiar al directorio del proyecto
cd /d "c:\Users\Lucidio\Proyectos\bootie-dev"

:: Extraer y reconstruir base de conocimientos
echo Actualizando Base de Conocimientos...
call npm run extract
echo.

:: Esperar 3 segundos y abrir el navegador en localhost:3000/admin
:: Usamos un ping local como un "sleep" temporal
start /b cmd /c "ping localhost -n 6 > nul && start http://localhost:3000/admin"

:: Iniciar el entorno de desarrollo
echo Iniciando servidor en puerto 3000...
call npm run dev

pause
