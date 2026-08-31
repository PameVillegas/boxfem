import React, { useState } from 'react'
import { Layout, Drawer, Button } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  DashboardOutlined, 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  WhatsAppOutlined,
  LogoutOutlined,
  MenuOutlined,
  TagsOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'

const { Header } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/clients', icon: <UserOutlined />, label: 'Clientes' },
  { key: '/payments', icon: <DollarOutlined />, label: 'Pagos' },
  { key: '/classes', icon: <CalendarOutlined />, label: 'Clases' },
  { key: '/attendance', icon: <CheckCircleOutlined />, label: 'Asistencia' },
  { key: '/whatsapp', icon: <WhatsAppOutlined />, label: 'WhatsApp' },
  { key: '/prices', icon: <TagsOutlined />, label: 'Precios' }
]

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(17,17,19,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 28px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 56
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 10 }}
          onClick={() => navigate('/dashboard')}
        >
          <img src="/logobox.png" alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ color: '#ff1493', fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>FEMMBOX</span>
        </div>

        <div className="desktop-menu" style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
          {menuItems.map(item => {
            const active = location.pathname === item.key
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#ff1493' : '#999',
                  background: active ? 'rgba(255,20,147,0.12)' : 'transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#ddd'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'transparent' } }}
              >
                {item.icon}
                {item.label}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="desktop-menu"
            onClick={logout}
            style={{ color: '#666', fontSize: 16, cursor: 'pointer', padding: 6, borderRadius: 8, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
            onMouseLeave={e => e.currentTarget.style.color = '#666'}
          >
            <LogoutOutlined />
          </div>
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: '#ccc', fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            className="mobile-menu-btn"
            style={{ padding: 4, display: 'none' }}
          />
        </div>
      </Header>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { navigate('/dashboard'); setDrawerOpen(false) }}>
            <img src="/logobox.png" alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontWeight: 700, color: '#ff1493' }}>FEMMBOX</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={260}
        styles={{ body: { padding: '12px 8px' }, header: { background: '#1e1e22', borderBottom: '1px solid #2a2a2e' }, content: { background: '#1e1e22' } }}
      >
        {menuItems.map(item => {
          const active = location.pathname === item.key
          return (
            <div
              key={item.key}
              onClick={() => { navigate(item.key); setDrawerOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                color: active ? '#ff1493' : '#bbb',
                background: active ? 'rgba(255,20,147,0.12)' : 'transparent',
                marginBottom: 4,
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.label}
            </div>
          )
        })}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #2a2a2e', marginTop: 12 }}>
          <div style={{ marginBottom: 10, color: '#666', fontSize: 13 }}>
            {user?.name || user?.username}
          </div>
          <Button danger icon={<LogoutOutlined />} onClick={() => { logout(); setDrawerOpen(false) }} block size="small" style={{ borderRadius: 8 }}>
            Cerrar Sesión
          </Button>
        </div>
      </Drawer>

      <style>{`
        .desktop-menu { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}

export default Navbar
