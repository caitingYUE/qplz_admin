import React, { useState } from 'react';
import { Layout, Menu, theme, Button } from 'antd';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarOutlined,
  UnorderedListOutlined,
  UserOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import RegistrationList from './components/RegistrationList';
import Dashboard from './components/Dashboard';

const { Header, Sider, Content } = Layout;

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/events',
      icon: <UnorderedListOutlined />,
      label: '活动管理',
    },
    {
      key: '/create-event',
      icon: <CalendarOutlined />,
      label: '创建活动',
    },
    {
      key: '/registrations',
      icon: <UserOutlined />,
      label: '报名管理',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden' // 禁用Layout级别滚动
    }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={200} 
        collapsedWidth={80}
        style={{
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <div className="admin-logo">
          <h3 style={{ 
            color: '#fff', 
            textAlign: 'center', 
            margin: '16px 0',
            fontSize: collapsed ? '14px' : '16px',
            transition: 'all 0.2s'
          }}>
            {collapsed ? 'QPLZ' : 'QPLZ管理后台'}
          </h3>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            height: 'calc(100vh - 100px)', // 减去logo区域高度
            overflow: 'auto' // 菜单项过多时允许内部滚动
          }}
        />
      </Sider>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Header style={{ 
          padding: 0, 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px', // 固定Header高度
          flexShrink: 0 // 防止Header被压缩
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b01c02' }}>
              前排落座女性社区 - 管理后台
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '8px', // 减少margin
            padding: '12px', // 减少padding
            height: 'calc(100vh - 64px - 16px)', // 精确计算高度：总高度 - Header高度 - margin
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'hidden', // 禁用Content滚动，让各个组件自己处理内部滚动
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/create-event" element={<EventForm />} />
            <Route path="/edit-event/:id" element={<EventForm />} />
            <Route path="/registrations" element={<RegistrationList />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 