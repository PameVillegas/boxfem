import React, { useState } from 'react'
import { Layout, Menu, Typography, Drawer, Button } from 'antd'
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
        background: 'linear-gradient(90deg, #e91e63, #d81b60)',
        padding: '0 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 56
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logobox.jpeg" alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }} />
          <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>BOXFEM</span>
        </div>

        {/* Desktop menu */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="desktop-menu"
          style={{ flex: 1, background: 'transparent', borderBottom: 'none', marginLeft: 20 }}
        />

        {/* Mobile hamburger */}
        <Button
          type="text"
          icon={<MenuOutlined style={{ color: 'white', fontSize: 22 }} />}
          onClick={() => setDrawerOpen(true)}
          className="mobile-menu-btn"
        />

        <LogoutOutlined 
          onClick={logout} 
          className="desktop-menu"
          style={{ color: 'white', fontSize: 18, cursor: 'pointer', marginLeft: 16 }} 
        />
      </Header>

      {/* Mobile drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logobox.jpeg" alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }} />
            <span style={{ fontWeight: 'bold' }}>BOXFEM</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={260}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleNavigate(key)}
          style={{ border: 'none', fontSize: 16 }}
        />
        <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
          <div style={{ marginBottom: 12, color: '#666' }}>
            {user?.name || user?.username}
          </div>
          <Button danger icon={<LogoutOutlined />} onClick={() => { logout(); setDrawerOpen(false) }} block>
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
