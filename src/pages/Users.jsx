import { useEffect, useState, useCallback } from 'react';
import {
  Table, Typography, Input, Select, message, Switch, Tooltip,
  Button, Modal, Form, Space, Popconfirm,
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import userService from '../features/users/userService';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../features/auth/authSlice';

const { Title, Text } = Typography;

const ROLE_MAP = {
  admin: { label: 'Administrator', bg: '#E1F0EA', color: '#0B5744', dot: '#0F6E56' },
  chemist: { label: 'Kimyogar', bg: '#E7EFF5', color: '#2B6693', dot: '#2B6693' },
  laborant: { label: 'Laborant', bg: '#FBF0DD', color: '#8A5C15', dot: '#B9791F' },
  viewer: { label: 'Kuzatuvchi', bg: '#EFEEE7', color: '#6B6A5F', dot: '#6B6A5F' },
};

const ROLE_OPTIONS = Object.entries(ROLE_MAP).map(([value, cfg]) => ({ value, label: cfg.label }));

export default function Users() {
  const currentUser = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [savingId, setSavingId] = useState(null);

  // Yaratish modali
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  // Tahrirlash modali
  const [editingUser, setEditingUser] = useState(null);
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    userService
      .list(params)
      .then((res) => {
        const results = res.results ?? res;
        setData(Array.isArray(results) ? results : []);
        setPagination((p) => ({ ...p, current: page, total: res.count ?? results.length ?? 0 }));
      })
      .catch(() => message.error("Foydalanuvchilarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  if (role && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = async (record, newRole) => {
    setSavingId(record.id);
    try {
      await userService.updateRole(record.id, { role: newRole });
      message.success('Rol yangilandi');
      setData((prev) => prev.map((u) => (u.id === record.id ? { ...u, role: newRole } : u)));
    } catch (err) {
      message.error(err.response?.data?.detail || "Rolni yangilab bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  const handleActiveToggle = async (record, checked) => {
    setSavingId(record.id);
    try {
      await userService.updateRole(record.id, { is_active: checked });
      message.success(checked ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi bloklandi');
      setData((prev) =>
        prev.map((u) => (u.id === record.id ? { ...u, is_active: checked, is_active_profile: checked } : u))
      );
    } catch (err) {
      message.error(err.response?.data?.detail || "Holatni yangilab bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      await userService.create(values);
      message.success('Yangi foydalanuvchi yaratildi');
      setCreateOpen(false);
      createForm.resetFields();
      fetchData(1);
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Foydalanuvchi yaratib bo'lmadi");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (record) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      first_name: record.first_name,
      last_name: record.last_name,
      lab_name: record.lab_name,
      phone: record.phone,
    });
  };

  const handleEditSave = async (values) => {
    setSaving(true);
    try {
      await userService.update(editingUser.id, {
        first_name: values.first_name,
        last_name: values.last_name,
        profile: { lab_name: values.lab_name || '', phone: values.phone || '' },
      });
      message.success("Ma'lumotlar yangilandi");
      setEditingUser(null);
      fetchData(pagination.current);
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Ma'lumotlarni yangilab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await userService.remove(record.id);
      message.success("Foydalanuvchi o'chirildi");
      fetchData(pagination.current);
    } catch (err) {
      message.error(err.response?.data?.detail || "Foydalanuvchini o'chirib bo'lmadi");
    }
  };

  const columns = [
    {
      title: 'Foydalanuvchi',
      key: 'user',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {[r.first_name, r.last_name].filter(Boolean).join(' ') || r.username}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
        </div>
      ),
    },
    {
      title: 'Laboratoriya',
      dataIndex: 'lab_name',
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Rol',
      key: 'role',
      width: 190,
      render: (_, r) => {
        const isSelf = currentUser?.id === r.id;
        return (
          <Tooltip title={isSelf ? "O'zingizning rolingizni bu yerdan o'zgartira olmaysiz" : ''}>
            <Select
              value={r.role}
              options={ROLE_OPTIONS}
              style={{ width: 165 }}
              disabled={isSelf || savingId === r.id}
              loading={savingId === r.id}
              onChange={(newRole) => handleRoleChange(r, newRole)}
              optionRender={(opt) => {
                const cfg = ROLE_MAP[opt.value];
                return (
                  <span className="status-chip" style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="status-chip__dot" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                );
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Faol',
      key: 'is_active',
      width: 80,
      render: (_, r) => {
        const isSelf = currentUser?.id === r.id;
        return (
          <Tooltip title={isSelf ? "O'zingizni bloklay olmaysiz" : ''}>
            <Switch
              checked={r.is_active_profile ?? r.is_active}
              disabled={isSelf || savingId === r.id}
              onChange={(checked) => handleActiveToggle(r, checked)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Ro'yxatdan o'tgan",
      dataIndex: 'date_joined',
      render: (v) => (v ? new Date(v).toLocaleDateString('uz-UZ') : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, r) => {
        const isSelf = currentUser?.id === r.id;
        return (
          <Space>
            <Tooltip title="Tahrirlash">
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
            </Tooltip>
            <Tooltip title={isSelf ? "O'zingizni o'chira olmaysiz" : "O'chirish"}>
              <Popconfirm
                title="Foydalanuvchini o'chirish"
                description="Bu amalni ortga qaytarib bo'lmaydi. Davom etamizmi?"
                okText="Ha, o'chirish"
                okButtonProps={{ danger: true }}
                cancelText="Yo'q"
                disabled={isSelf}
                onConfirm={() => handleDelete(r)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} disabled={isSelf} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Foydalanuvchilar</Title>
          <Text type="secondary">Hisoblarni, rollarni va kirish huquqlarini shu yerdan boshqaring</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Yangi foydalanuvchi
        </Button>
      </div>

      <Input
        placeholder="Email, ism yoki familiya bo'yicha qidirish"
        prefix={<SearchOutlined />}
        allowClear
        style={{ maxWidth: 360, marginBottom: 16 }}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table
        rowKey="id"
        columns={columns}
        scroll={{ x: 'max-content' }}
        dataSource={data}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page) => fetchData(page),
        }}
      />

      {/* Yangi foydalanuvchi yaratish */}
      <Modal
        title="Yangi foydalanuvchi qo'shish"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Yaratish"
        cancelText="Bekor qilish"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="ism@lab.uz" />
          </Form.Item>
          <Form.Item name="username" label="Foydalanuvchi nomi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="first_name" label="Ism" rules={[{ required: true }]} style={{ width: '50%' }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Familiya" rules={[{ required: true }]} style={{ width: '50%' }}>
              <Input />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="password" label="Parol" rules={[{ required: true, min: 8 }]}>
            <Input.Password placeholder="Kamida 8 ta belgi" />
          </Form.Item>
          <Form.Item name="role" label="Rol" initialValue="viewer" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="lab_name" label="Laboratoriya" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Telefon" style={{ width: '50%' }}>
              <Input placeholder="+998 XX XXX XX XX" />
            </Form.Item>
          </Space.Compact>
        </Form>
      </Modal>

      {/* Tahrirlash */}
      <Modal
        title="Foydalanuvchi ma'lumotlarini tahrirlash"
        open={Boolean(editingUser)}
        onCancel={() => setEditingUser(null)}
        onOk={() => editForm.submit()}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave} style={{ marginTop: 16 }}>
          <Space.Compact block>
            <Form.Item name="first_name" label="Ism" rules={[{ required: true }]} style={{ width: '50%' }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Familiya" rules={[{ required: true }]} style={{ width: '50%' }}>
              <Input />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="lab_name" label="Laboratoriya" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Telefon" style={{ width: '50%' }}>
              <Input placeholder="+998 XX XXX XX XX" />
            </Form.Item>
          </Space.Compact>
        </Form>
      </Modal>
    </div>
  );
}