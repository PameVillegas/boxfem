import React, { useState } from 'react'
import { Layout, Menu, Drawer, Button } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  DashboardOutlined, 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  WhatsAppOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'

const { Header } = Layout

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/clients', icon: <UserOutlined />, label: 'Clientes' },
    { key: '/payments', icon: <DollarOutlined />, label: 'Pagos' },
    { key: '/classes', icon: <CalendarOutlined />, label: 'Clases' },
    { key: '/attendance', icon: <CheckCircleOutlined />, label: 'Asistencia' },
    { key: '/whatsapp', icon: <WhatsAppOutlined />, label: 'WhatsApp' }
  ]

  const handleNavigate = (key) => {
    navigate(key)
    setDrawerOpen(false)
  }

  return (
    <>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(20,20,20,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,20,147,0.2)',
        padding: '0 12px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 52
      }}>
        {/* Logo clickeable */}
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          <img src="/logobox.png" alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }} />
          <span style={{ color: '#ff1493', fontSize: 16, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,20,147,0.5)' }}>FEMMBOX</span>
        </div>

        {/* Desktop menu */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="desktop-menu"
          style={{ flex: 1, background: 'transparent', borderBottom: 'none', marginLeft: 16, minWidth: 0 }}
        />

        {/* Mobile hamburger */}
        <Button
          type="text"
          icon={<MenuOutlined style={{ color: 'white', fontSize: 20 }} />}
          onClick={() => setDrawerOpen(true)}
          className="mobile-menu-btn"
          style={{ padding: 4 }}
        />

        <LogoutOutlined 
          onClick={logout} 
          className="desktop-menu"
          style={{ color: 'white', fontSize: 16, cursor: 'pointer', marginLeft: 12 }} 
        />
      </Header>

      {/* Mobile drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }} onClick={() => { navigate('/dashboard'); setDrawerOpen(false) }}>
            <img src="/logobox.png" alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }} />
            <span style={{ fontWeight: 'bold' }}>FEMMBOX</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={240}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleNavigate(key)}
          style={{ border: 'none', fontSize: 15 }}
        />
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', marginTop: 12 }}>
          <div style={{ marginBottom: 10, color: '#666', fontSize: 13 }}>
            {user?.name || user?.username}
          </div>
          <Button danger icon={<LogoutOutlined />} onClick={() => { logout(); setDrawerOpen(false) }} block size="small">
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
