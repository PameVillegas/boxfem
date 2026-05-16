#!/bin/bash
# Script de build para producción
# Compila el frontend y lo copia al backend/public

echo "=== Instalando dependencias del backend ==="
cd backend
npm install

echo "=== Instalando dependencias del frontend ==="
cd ../frontend
npm install

echo "=== Compilando frontend ==="
npm run build

echo "=== Copiando build al backend ==="
rm -rf ../backend/public
cp -r build ../backend/public

echo "=== Build completo ==="
echo "Para iniciar: cd backend && node server.js"
