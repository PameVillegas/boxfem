import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ConfigProvider, Layout, theme } from 'antd'
import esES from 'antd/locale/es_ES'
import Login from './pages/Login'
import ClientPortal from './pages/ClientPortal'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Payments from './pages/Payments'
import Classes from './pages/Classes'
import Attendance from './pages/Attendance'
import WhatsAppConfig from './pages/WhatsAppConfig'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import { AuthProvider, useAuth } from './context/AuthContext'

const { Content, Footer } = Layout

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div>Cargando...</div>

  // El portal de clientes es completamente independiente, sin navbar ni layout admin
  if (location.pathname === '/portal') {
    return <ClientPortal />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {user && <Navbar />}
      <Content style={{ padding: '12px', marginTop: user ? 52 : 0, background: '#1a1a1a', minHeight: 'calc(100vh - 100px)', overflow: 'hidden' }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/classes" element={<PrivateRoute><Classes /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/whatsapp" element={<PrivateRoute><WhatsAppConfig /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', padding: '12px', background: '#1a1a1a', color: '#888' }}>
        FEMMBOX ©2026
      </Footer>
    </Layout>
  )
}

function App() {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: '#ff1493',
          colorBgBase: '#1a1a1a',
          colorTextBase: '#ffffff',
          colorBgContainer: '#2a2a2a',
          colorBorder: '#444',
          colorBgElevated: '#333',
          borderRadius: 8
        },
        algorithm: theme.darkAlgorithm
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
