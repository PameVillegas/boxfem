# BoxFem - Sistema de Gestión para Gimnasio de Boxeo

Plataforma digital para administrar clientes, pagos, turnos y asistencia de un gimnasio de boxeo.

## 🚀 Características Principales

### 👤 Gestión de Clientes
- Registro completo de socios
- Control de planes y vencimientos
- Historial de pagos y asistencia
- Estados: Activo / Vencido / Bloqueado

### 💳 Sistema de Pagos
- Registro de pagos con múltiples métodos
- Control automático de vencimientos
- Historial completo de transacciones
- Comprobantes digitales
- Estadísticas mensuales de ingresos

### 📅 Reserva de Clases
- Gestión de horarios para: Boxeo, Funcional, Spinning, Crossfit, Yoga, Pilates, Personal Trainer
- Control de capacidad
- Inscripción y cancelación de turnos
- Visualización de clases más populares

### ✅ Control de Asistencia
- Registro por código QR / código personal / manual
- Estadísticas de asistencia
- Bloqueo automático de clientes vencidos

### 📊 Dashboard Administrativo
- Estadísticas en tiempo real
- Clientes activos y vencidos
- Ingresos mensuales
- Asistencia diaria
- Clases más utilizadas

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con **Express**
- **MongoDB** con **Mongoose**
- Autenticación con **JWT**
- **node-cron** para tareas programadas

### Frontend
- **React** con **React Router**
- **Ant Design** para UI components
- **Recharts** para gráficos
- **Axios** para peticiones HTTP
- **Day.js** para manejo de fechas

## 📦 Instalación

### Prerrequisitos
- Node.js (v18 o superior)
- MongoDB instalado y corriendo
- npm o yarn

### Backend
```bash
cd backend
npm install
npm run dev
```
El servidor correrá en `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm start
```
La app correrá en `http://localhost:3000`

### Configuración
1. Asegúrate de que MongoDB esté corriendo en `localhost:27017`
2. Configura las variables en `backend/.env` si es necesario
3. El primer usuario admin debe crearse directamente en la base de datos o vía API

## 🔑 Uso

1. Ingresa con credenciales de administrador
2. Registra clientes con sus planes
3. Registra pagos para activar cuentas
4. Configura las clases y horarios
5. Controla la asistencia diaria
6. Consulta estadísticas en el Dashboard

## 📱 Funcionalidades Futuras
- Integración con Mercado Pago
- App móvil nativa
- Rutinas personalizadas
- Seguimiento físico y nutrición
- Múltiples sucursales
- Tienda online

## 🔒 Seguridad
- Autenticación JWT
- Contraseñas encriptadas con bcrypt
- Control de acceso por roles
- Protección de rutas API

---
Desarrollado para BoxFem - Gestión Moderna de Gimnasios de Boxeo
