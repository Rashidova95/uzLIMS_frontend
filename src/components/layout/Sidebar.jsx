import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ContainerOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  FilePdfOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../features/auth/authSlice';

const { Sider } = Layout;

const NAV_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/samples', icon: <ContainerOutlined />, label: 'Namunalar' },
  { key: '/experiments', icon: <ExperimentOutlined />, label: 'Tajribalar' },
  { key: '/inventory', icon: <DatabaseOutlined />, label: 'Inventar' },
  { key: '/reports', icon: <FilePdfOutlined />, label: 'Hisobotlar' },
];

const ADMIN_NAV_ITEM = { key: '/users', icon: <TeamOutlined />, label: 'Foydalanuvchilar' };

export default function Sidebar({ collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useSelector(selectUserRole);

  const items = role === 'admin' ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <Sider
      collapsed={collapsed}
      width={216}
      style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'var(--lab-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            C
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, lineHeight: 1.1 }}>
                ChemLab UZ
              </div>
              <div style={{ color: '#8B958E', fontSize: 10.5, lineHeight: 1.1 }}>LIMS · MVP 1.0</div>
            </div>
          )}
        </div>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, paddingTop: 8 }}
      />
    </Sider>
  );
}
