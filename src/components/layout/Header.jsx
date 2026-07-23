import { useState } from 'react';
import { Layout, Avatar, Dropdown, Button, Modal, Form, Input, message, Tabs } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectCurrentUser, selectUserRole, fetchCurrentUser } from '../../features/auth/authSlice';
import authService from '../../features/auth/authService';

const { Header: AntHeader } = Layout;

const ROLE_LABELS = {
  admin: 'Administrator',
  chemist: 'Senior kimyogar',
  laborant: 'Laborant',
  viewer: 'Kuzatuvchi',
};

export default function Header({ collapsed, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      : user?.email;

  const initials = (displayName || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const openSettings = () => {
    profileForm.setFieldsValue({
      first_name: user?.first_name,
      last_name: user?.last_name,
      lab_name: user?.profile?.lab_name,
      phone: user?.profile?.phone,
    });
    setSettingsOpen(true);
  };

  const handleProfileSave = async (values) => {
    setSavingProfile(true);
    try {
      await authService.updateMe({
        first_name: values.first_name,
        last_name: values.last_name,
        profile: { lab_name: values.lab_name || '', phone: values.phone || '' },
      });
      message.success("Profil ma'lumotlari yangilandi");
      dispatch(fetchCurrentUser());
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Yangilab bo'lmadi");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (values) => {
    setSavingPassword(true);
    try {
      await authService.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success("Parol o'zgartirildi");
      passwordForm.resetFields();
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Parolni o'zgartirib bo'lmadi");
    } finally {
      setSavingPassword(false);
    }
  };

  const menuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: 'Profil sozlamalari' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Chiqish', danger: true },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--panel)',
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
      />

      <Dropdown
        menu={{
          items: menuItems,
          onClick: ({ key }) => {
            if (key === 'logout') handleLogout();
            if (key === 'settings') openSettings();
          },
        }}
        placement="bottomRight"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              {ROLE_LABELS[role] || role}
            </div>
          </div>
          <Avatar style={{ background: 'var(--lab-teal-soft)', color: 'var(--lab-teal-deep)' }} icon={!displayName && <UserOutlined />}>
            {displayName ? initials : null}
          </Avatar>
        </div>
      </Dropdown>

      <Modal
        title="Profil sozlamalari"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={null}
        width={480}
      >
        <Tabs
          items={[
            {
              key: 'profile',
              label: "Profil ma'lumotlari",
              children: (
                <Form form={profileForm} layout="vertical" onFinish={handleProfileSave} style={{ marginTop: 12 }}>
                  <Form.Item label="Email">
                    <Input value={user?.email} disabled />
                  </Form.Item>
                  <Form.Item name="first_name" label="Ism" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="last_name" label="Familiya" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="lab_name" label="Laboratoriya">
                    <Input />
                  </Form.Item>
                  <Form.Item name="phone" label="Telefon">
                    <Input placeholder="+998 XX XXX XX XX" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={savingProfile} block>
                    Saqlash
                  </Button>
                </Form>
              ),
            },
            {
              key: 'password',
              label: 'Parolni o\u2019zgartirish',
              children: (
                <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSave} style={{ marginTop: 12 }}>
                  <Form.Item name="old_password" label="Joriy parol" rules={[{ required: true }]}>
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item name="new_password" label="Yangi parol" rules={[{ required: true, min: 8 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Kamida 8 ta belgi" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={savingPassword} block>
                    Parolni yangilash
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Modal>
    </AntHeader>
  );
}
