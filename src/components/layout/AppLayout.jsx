import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchCurrentUser } from '../../features/auth/authSlice';

const { Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <Layout>
        <Header collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <Content style={{ background: 'var(--paper)' }}>
          <div className="page-scroll">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
