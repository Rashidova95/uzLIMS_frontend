import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Table, Button, Typography, Modal, Form, Input, Select, InputNumber, DatePicker,
  message, Space, Popconfirm, Tooltip, Segmented, Drawer, Descriptions,
} from 'antd';
import {
  PlusOutlined, StopOutlined, SearchOutlined, CheckCircleOutlined, EyeOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import chemicalService from '../features/chemicals/chemicalService';
import SpecimenTag from '../components/common/SpecimenTag';
import HazardBadge from '../components/common/HazardBadge';
import RoleGuard from '../components/common/RoleGuard';
import { selectUserRole } from '../features/auth/authSlice';

const { Title, Text } = Typography;

const HAZARD_OPTIONS = [
  { value: 1, label: 'Past xavf (GHS 1)' },
  { value: 2, label: "O'rta xavf (GHS 2)" },
  { value: 3, label: 'Yuqori xavf (GHS 3)' },
  { value: 4, label: 'Juda yuqori xavf (GHS 4)' },
];
const UNIT_OPTIONS = [
  { value: 'g', label: 'g — Gram' },
  { value: 'kg', label: 'kg — Kilogram' },
  { value: 'mg', label: 'mg — Milligram' },
  { value: 'ml', label: 'ml — Millilitr' },
  { value: 'l', label: 'l — Litr' },
  { value: 'mol', label: 'mol — Mol' },
];

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const days = dayjs(dateStr).diff(dayjs(), 'day');
  return days <= 30 && days >= 0;
}
function isExpired(dateStr) {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), 'day');
}
function isLowStock(item) {
  return Number(item.quantity) <= Number(item.min_threshold ?? 0);
}

export default function Inventory() {
  const role = useSelector(selectUserRole);
  const canEditQuantity = role === 'admin' || role === 'chemist';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChemical, setEditingChemical] = useState(null); // null = yaratish, aks holda tahrirlash
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [showInactive, setShowInactive] = useState(false);
  const [editingQty, setEditingQty] = useState(null); // { id, value }

  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    const params = { page, is_active: showInactive ? 'false' : 'true' };
    if (search) params.search = search;
    chemicalService
      .list(params)
      .then((res) => {
        const results = res.results ?? res;
        setData(Array.isArray(results) ? results : []);
        setPagination((p) => ({ ...p, current: page, total: res.count ?? results.length ?? 0 }));
      })
      .catch(() => message.error("Reaktivlarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [search, showInactive]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const openCreateModal = () => {
    setEditingChemical(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingChemical(record);
    form.setFieldsValue({
      ...record,
      expiry_date: record.expiry_date ? dayjs(record.expiry_date) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    const payload = {
      ...values,
      expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : null,
    };
    try {
      if (editingChemical) {
        await chemicalService.update(editingChemical.id, payload);
        message.success('Reaktiv yangilandi');
      } else {
        await chemicalService.create(payload);
        message.success("Reaktiv qo'shildi");
      }
      setModalOpen(false);
      form.resetFields();
      fetchData(editingChemical ? pagination.current : 1);
      if (detailRecord?.id === editingChemical?.id) setDetailRecord(null);
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleQuantitySave = async (id) => {
    const { action, amount } = editingQty;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      message.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }

    try {
      await chemicalService.updateQuantity(id, action, numAmount);
      message.success(action === 'add' ? 'Miqdor qo\'shildi' : 'Miqdor ayirildi');
      setEditingQty(null);
      fetchData(pagination.current);
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Miqdorni yangilab bo'lmadi");
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await chemicalService.deactivate(id);
      message.success('Reaktiv faolsizlantirildi');
      setDetailRecord(null);
      fetchData(pagination.current);
    } catch {
      message.error("Amalni bajarib bo'lmadi");
    }
  };

  const handleActivate = async (id) => {
    try {
      await chemicalService.activate(id);
      message.success('Reaktiv qayta faollashtirildi');
      setDetailRecord(null);
      fetchData(pagination.current);
    } catch {
      message.error("Amalni bajarib bo'lmadi");
    }
  };

  const openDetail = async (record) => {
    setDetailRecord({ ...record });
    setDetailLoading(true);
    try {
      const full = await chemicalService.getById(record.id);
      setDetailRecord(full);
    } catch {
      message.error("Reaktiv tafsilotlarini yuklab bo'lmadi");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'CAS raqami',
      dataIndex: 'cas_number',
      width: 150,
      render: (v, r) => {
        let tone = 'slate';
        if (isExpired(r.expiry_date) || (r.hazard_level >= 4)) tone = 'red';
        else if (isExpiringSoon(r.expiry_date) || isLowStock(r)) tone = 'amber';
        else tone = 'teal';
        return <SpecimenTag tone={tone}>{v}</SpecimenTag>;
      },
    },
    {
      title: 'Nomi',
      dataIndex: 'name_uz',
      render: (v, r) => (
        <div>
          <div>{v}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.name_iupac}</Text>
        </div>
      ),
    },
    { title: 'Yetkazib beruvchi', dataIndex: 'supplier', width: 140, ellipsis: true, render: (v) => v || '—' },
    {
      title: 'Miqdor',
      width: 220,
      render: (_, r) =>
        editingQty?.id === r.id ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Segmented
              size="small"
              value={editingQty.action}
              onChange={(v) => setEditingQty({ ...editingQty, action: v })}
              options={[
                { label: "Qo'shish", value: 'add' },
                { label: 'Ayirish', value: 'subtract' },
              ]}
            />
            <Space.Compact>
              <InputNumber
                size="small"
                autoFocus
                min={0}
                value={editingQty.amount}
                onChange={(v) => setEditingQty({ ...editingQty, amount: v })}
                style={{ width: 90 }}
                placeholder={`Miqdor (${r.unit})`}
              />
              <Button size="small" type="primary" onClick={() => handleQuantitySave(r.id)}>OK</Button>
              <Button size="small" onClick={() => setEditingQty(null)}>Bekor</Button>
            </Space.Compact>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.quantity} {r.unit}
              {' → '}
              <strong>
                {editingQty.amount
                  ? (editingQty.action === 'add'
                      ? Number(r.quantity) + Number(editingQty.amount)
                      : Number(r.quantity) - Number(editingQty.amount))
                  : r.quantity} {r.unit}
              </strong>
            </Text>
          </div>
        ) : canEditQuantity ? (
          <span
            className="mono"
            style={{
              cursor: 'pointer',
              color: isLowStock(r) ? 'var(--reagent-amber)' : 'inherit',
              fontWeight: isLowStock(r) ? 600 : 400,
            }}
            onClick={() => setEditingQty({ id: r.id, action: 'subtract', amount: null })}
          >
            {r.quantity} {r.unit}
          </span>
        ) : (
          <span
            className="mono"
            style={{ color: isLowStock(r) ? 'var(--reagent-amber)' : 'inherit', fontWeight: isLowStock(r) ? 600 : 400 }}
          >
            {r.quantity} {r.unit}
          </span>
        ),
    },
    {
      title: 'Xavf darajasi',
      dataIndex: 'hazard_level',
      width: 110,
      render: (v) => <HazardBadge level={v} />,
    },
    {
      title: 'Muddati',
      dataIndex: 'expiry_date',
      width: 130,
      render: (v) => {
        if (!v) return '—';
        const expired = isExpired(v);
        const soon = isExpiringSoon(v);
        return (
          <span style={{ color: expired ? 'var(--hazard-red)' : soon ? 'var(--reagent-amber)' : 'inherit' }}>
            {dayjs(v).format('DD.MM.YYYY')}
          </span>
        );
      },
    },
    {
      title: '',
      width: 130,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="Batafsil ko'rish">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <RoleGuard allow={['admin']}>
            <Tooltip title="Tahrirlash">
              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            </Tooltip>
            {showInactive ? (
              <Tooltip title="Qayta faollashtirish">
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: 'var(--lab-teal)' }} />}
                  onClick={() => handleActivate(record.id)}
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title="Reaktivni faolsizlantirasizmi?"
                onConfirm={() => handleDeactivate(record.id)}
              >
                <Tooltip title="Faolsizlantirish">
                  <Button size="small" type="text" icon={<StopOutlined style={{ color: 'var(--hazard-red)' }} />} />
                </Tooltip>
              </Popconfirm>
            )}
          </RoleGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ marginBottom: 2 }}>Inventar</Title>
          <Text type="secondary">Kimyoviy moddalar ombori</Text>
        </div>
        <RoleGuard allow={['admin']}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yangi reaktiv
          </Button>
        </RoleGuard>
      </div>

      <Space style={{ marginBottom: 14 }} wrap>
        <Input
          placeholder="Nomi yoki CAS raqami bo'yicha qidirish..."
          prefix={<SearchOutlined style={{ color: 'var(--ink-soft)' }} />}
          style={{ width: 280 }}
          allowClear
          onPressEnter={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <RoleGuard allow={['admin']}>
          <Segmented
            value={showInactive ? 'inactive' : 'active'}
            onChange={(v) => setShowInactive(v === 'inactive')}
            options={[
              { label: 'Faol', value: 'active' },
              { label: 'Faolsizlantirilgan', value: 'inactive' },
            ]}
          />
        </RoleGuard>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        scroll={{ x: 'max-content' }}
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page) => fetchData(page),
          showTotal: (total) => `Jami ${total} ta reaktiv`,
        }}
      />

      {/* ---- Yaratish / Tahrirlash ---- */}
      <Modal
        title={editingChemical ? 'Reaktivni tahrirlash' : "Yangi reaktiv qo'shish"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor qilish"
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="name_uz" label="Nomi (o'zbekcha)" rules={[{ required: true }]} style={{ width: '50%' }}>
              <Input placeholder="Sulfat kislota" />
            </Form.Item>
            <Form.Item name="name_iupac" label="IUPAC nomi" style={{ width: '50%' }}>
              <Input placeholder="Sulfuric acid" />
            </Form.Item>
          </Space.Compact>

          <Form.Item name="cas_number" label="CAS raqami" rules={[{ required: true }]}>
            <Input placeholder="7664-93-9" className="mono" />
          </Form.Item>

          <Form.Item name="formula" label="Kimyoviy formula">
            <Input placeholder="H2SO4" className="mono" />
          </Form.Item>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="quantity" label="Miqdor" rules={[{ required: true }]} style={{ width: '35%' }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="unit" label="Birlik" rules={[{ required: true }]} style={{ width: '25%' }}>
              <Select options={UNIT_OPTIONS} />
            </Form.Item>
            <Form.Item name="min_threshold" label="Chegara" style={{ width: '40%' }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="ogohlantirish chegarasi" />
            </Form.Item>
          </Space.Compact>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="hazard_level" label="Xavf darajasi (GHS)" rules={[{ required: true }]} style={{ width: '40%' }}>
              <Select options={HAZARD_OPTIONS} />
            </Form.Item>
            <Form.Item name="expiry_date" label="Muddati tugash sanasi" style={{ width: '60%' }}>
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Space.Compact>

          <Form.Item name="supplier" label="Yetkazib beruvchi">
            <Input placeholder="masalan: Navoiazot" />
          </Form.Item>
          <Form.Item name="storage_condition" label="Saqlash sharoiti">
            <Input placeholder="masalan: Sovutgichda, yorug'likdan uzoqda saqlansin" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ---- Batafsil ko'rish ---- */}
      <Drawer
        title={detailRecord?.name_uz || 'Reaktiv'}
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        width={440}
        loading={detailLoading}
        extra={
          detailRecord && (
            <RoleGuard allow={['admin']}>
              <Button size="small" icon={<EditOutlined />} onClick={() => { setDetailRecord(null); openEditModal(detailRecord); }}>
                Tahrirlash
              </Button>
            </RoleGuard>
          )
        }
      >
        {detailRecord && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="CAS raqami">
              <span className="mono">{detailRecord.cas_number}</span>
            </Descriptions.Item>
            <Descriptions.Item label="IUPAC nomi">{detailRecord.name_iupac || '—'}</Descriptions.Item>
            <Descriptions.Item label="Formula">{detailRecord.formula || '—'}</Descriptions.Item>
            <Descriptions.Item label="Miqdor">
              <span className="mono">{detailRecord.quantity} {detailRecord.unit}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Ogohlantirish chegarasi">
              {detailRecord.min_threshold ?? '—'} {detailRecord.unit}
            </Descriptions.Item>
            <Descriptions.Item label="Xavf darajasi">
              <HazardBadge level={detailRecord.hazard_level} />
            </Descriptions.Item>
            <Descriptions.Item label="Muddati tugash sanasi">
              {detailRecord.expiry_date ? dayjs(detailRecord.expiry_date).format('DD.MM.YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Yetkazib beruvchi">{detailRecord.supplier || '—'}</Descriptions.Item>
            <Descriptions.Item label="Saqlash sharoiti">{detailRecord.storage_condition || '—'}</Descriptions.Item>
            <Descriptions.Item label="Holat">
              {detailRecord.is_active === false ? "Faolsizlantirilgan" : 'Faol'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}