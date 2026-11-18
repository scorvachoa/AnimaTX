@echo off
title AnimaTX
cd /d "%~dp0"
if not exist node_modules (
  call npm install
  if errorlevel 1 goto error
)
call npm run build
if errorlevel 1 goto error
start "" http://127.0.0.1:4310
call npm start
goto :eof
:error
echo No se pudo iniciar. Revisa el mensaje anterior y tu conexion a Internet.
pause
