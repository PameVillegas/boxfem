FROM node:20-slim

WORKDIR /app

# Instalar dependencias del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Instalar y compilar frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copiar build del frontend al backend
RUN mkdir -p backend/public && cp -r frontend/build/* backend/public/

# Copiar código del backend
COPY backend/ ./backend/

# Crear carpeta de sesión WhatsApp
RUN mkdir -p backend/wa_session

# Limpiar frontend (ya no se necesita)
RUN rm -rf frontend

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
