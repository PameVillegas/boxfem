import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Layout, theme } from 'antd'
import esES from 'antd/locale/es_ES'
import Login from './pages/Login'
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
  
  if (loading) return <div>Cargando...</div>
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {user && <Navbar />}
      <Content style={{ padding: '16px', marginTop: user ? 56 : 0, background: '#fce4ec', minHeight: 'calc(100vh - 120px)' }}>
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
      <Footer style={{ textAlign: 'center' }}>
        BoxFem ©2026 - Gestión de Gimnasio de Boxeo
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
          colorPrimary: '#e91e63',
          borderRadius: 8
        },
        algorithm: theme.defaultAlgorithm
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
