import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Typography, Modal, Form, Input, Select, message, Space,
  Popconfirm, Drawer, Descriptions, Tag, Empty, Upload,
} from 'antd';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, MinusCircleOutlined, EyeOutlined,
  ArrowRightOutlined, PaperClipOutlined, UploadOutlined,
} from '@ant-design/icons';
import experimentService from '../features/experiments/experimentService';
import sampleService from '../features/samples/sampleService';
import chemicalService from '../features/chemicals/chemicalService';
import SpecimenTag from '../components/common/SpecimenTag';
import { ExperimentStatusChip } from '../components/common/StatusChip';
import RoleGuard from '../components/common/RoleGuard';

const { Title, Text } = Typography;

// Backend'dagi Experiment.VALID_TRANSITIONS bilan bir xil — faqat "review"dan keyingi
// qadam ikkita variantli (tasdiqlash/rad etish) bo'lgani uchun u alohida tugmalar bilan boshqariladi.
const NEXT_STATUS = {
  draft: { value: 'in_progress', label: "Jarayonga o'tkazish" },
  in_progress: { value: 'review', label: 'Tekshiruvga yuborish' },
  rejected: { value: 'in_progress', label: 'Qayta ishlashga qaytarish' },
};

export default function Experiments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [samples, setSamples] = useState([]);
  const [chemicals, setChemicals] = useState([]);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectForm] = Form.useForm();

  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    experimentService
      .list({ page })
      .then((res) => {
        const results = res.results ?? res;
        setData(Array.isArray(results) ? results : []);
        setPagination((p) => ({ ...p, current: page, total: res.count ?? results.length ?? 0 }));
      })
      .catch(() => message.error("Tajribalarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(1); }, [fetchData]);

  // Namuna/reaktiv ro'yxatlarini bir marta yuklaymiz — ham "Yangi tajriba" formasi,
  // ham tafsilot ko'rinishida reaktiv nomlarini ko'rsatish uchun kerak.
  useEffect(() => {
    Promise.all([
      sampleService.list({ page: 1 }),
      chemicalService.list({ page: 1 }),
    ])
      .then(([sRes, cRes]) => {
        setSamples(sRes.results ?? sRes ?? []);
        setChemicals(cRes.results ?? cRes ?? []);
      })
      .catch(() => {});
  }, []);

  const chemicalName = (id) => chemicals.find((c) => c.id === id)?.name_uz || `#${id}`;

  const openCreateModal = () => setModalOpen(true);

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const results = {};
      (values.results || []).forEach((r) => {
        if (r?.key) results[r.key] = { value: r.value, unit: r.unit };
      });
      const created = await experimentService.create({
        sample: values.sample,
        title: values.title,
        method: values.method,
        objective: values.objective,
        observations: values.observations,
        chemicals_used: values.chemicals_used || [],
        results,
      });

      if (attachmentFile) {
        try {
          await experimentService.uploadAttachment(created.id, attachmentFile);
        } catch {
          message.warning("Tajriba yaratildi, lekin faylni biriktirib bo'lmadi. Uni keyinroq qo'shishga urinib ko'ring.");
        }
      }

      message.success('Tajriba yaratildi');
      setModalOpen(false);
      form.resetFields();
      setAttachmentFile(null);
      fetchData(1);
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Tajriba yaratib bo'lmadi");
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await experimentService.approve(id);
      message.success('Tajriba tasdiqlandi');
      setDetailRecord(null);
      fetchData(pagination.current);
    } catch (err) {
      message.error(err.response?.data?.detail || "Tasdiqlab bo'lmadi");
    }
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      await experimentService.reject(rejectTarget.id, values.reason);
      message.success('Tajriba rad etildi');
      setRejectTarget(null);
      rejectForm.resetFields();
      setDetailRecord(null);
      fetchData(pagination.current);
    } catch (err) {
      if (err?.errorFields) return; // validatsiya xatosi
      message.error("Rad etib bo'lmadi");
    }
  };

  const handleAdvance = async (record) => {
    const next = NEXT_STATUS[record.status];
    if (!next) return;
    setTransitioning(true);
    try {
      await experimentService.update(record.id, { status: next.value });
      message.success('Holat yangilandi');
      setDetailRecord((prev) => (prev ? { ...prev, status: next.value } : prev));
      fetchData(pagination.current);
    } catch (err) {
      message.error(err.response?.data?.detail || err.response?.data?.status?.[0] || "Holatni o'zgartirib bo'lmadi");
    } finally {
      setTransitioning(false);
    }
  };

  const handleAttachmentUpload = async (file) => {
    setUploadingAttachment(true);
    try {
      const updated = await experimentService.uploadAttachment(detailRecord.id, file);
      message.success('Fayl biriktirildi');
      setDetailRecord(updated);
    } catch {
      message.error("Faylni biriktirib bo'lmadi (faqat PDF, JPG, PNG qabul qilinadi)");
    } finally {
      setUploadingAttachment(false);
    }
    return false; // antd Upload'ga o'zi avtomatik so'rov yubormasin, deb aytamiz
  };

  const openDetail = async (record) => {
    setDetailRecord({ ...record });
    setDetailLoading(true);
    try {
      const full = await experimentService.getById(record.id);
      setDetailRecord(full);
    } catch {
      message.error("Tajriba tafsilotlarini yuklab bo'lmadi");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'Sarlavha',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Namuna',
      dataIndex: 'sample_id',
      width: 170,
      render: (_, r) => <SpecimenTag tone="teal">{r.sample_id || r.sample?.sample_id || '—'}</SpecimenTag>,
    },
    { title: 'Metod', dataIndex: 'method', width: 130, ellipsis: true },
    {
      title: 'Holat',
      dataIndex: 'status',
      width: 130,
      render: (status) => <ExperimentStatusChip status={status} />,
    },
    {
      title: 'Bajaruvchi',
      dataIndex: 'performed_by_name',
      width: 130,
      render: (_, r) => r.performed_by_name || r.performed_by?.email || '—',
    },
    {
      title: 'Amallar',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            Ko'rish
          </Button>
          {(record.status === 'review') && (
            <RoleGuard allow={['admin', 'chemist']}>
              <Popconfirm title="Tajribani tasdiqlaysizmi?" onConfirm={() => handleApprove(record.id)}>
                <Button size="small" type="text" icon={<CheckOutlined style={{ color: 'var(--lab-teal)' }} />} />
              </Popconfirm>
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined style={{ color: 'var(--hazard-red)' }} />}
                onClick={() => setRejectTarget(record)}
              />
            </RoleGuard>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ marginBottom: 2 }}>Tajribalar</Title>
          <Text type="secondary">Elektron laboratoriya daftari (ELN)</Text>
        </div>
        <RoleGuard allow={['admin', 'chemist', 'laborant']}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yangi tajriba
          </Button>
        </RoleGuard>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        scroll={{ x: 'max-content' }}
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page) => fetchData(page),
          showTotal: (total) => `Jami ${total} ta tajriba`,
        }}
      />

      {/* ---- Yangi tajriba modali ---- */}
      <Modal
        title="Yangi tajriba"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setAttachmentFile(null); }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="Saqlash"
        cancelText="Bekor qilish"
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="sample" label="Namuna" rules={[{ required: true }]}>
            <Select
              placeholder="Namunani tanlang"
              showSearch
              optionFilterProp="label"
              options={samples.map((s) => ({ value: s.id, label: `${s.sample_id} — ${s.name}` }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Tajriba nomi" rules={[{ required: true }]}>
            <Input placeholder="masalan: pH darajasini aniqlash" />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="method" label="Metod" style={{ width: '50%' }}>
              <Input placeholder="masalan: Titrlash" />
            </Form.Item>
            <Form.Item name="chemicals_used" label="Ishlatilgan reaktivlar" style={{ width: '50%' }}>
              <Select
                mode="multiple"
                placeholder="Reaktivlarni tanlang"
                optionFilterProp="label"
                options={chemicals.map((c) => ({ value: c.id, label: c.name_uz }))}
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="objective" label="Maqsad">
            <Input.TextArea rows={2} placeholder="Tajriba maqsadi..." />
          </Form.Item>
          <Form.Item name="observations" label="Kuzatuvlar">
            <Input.TextArea rows={2} placeholder="Kuzatilgan natijalar..." />
          </Form.Item>

          <Form.Item label="Natijalar (kalit / qiymat / birlik)">
            <Form.List name="results">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...rest} name={[name, 'key']} noStyle>
                        <Input placeholder="pH" style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'value']} noStyle>
                        <Input placeholder="qiymat" style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'unit']} noStyle>
                        <Input placeholder="birlik" style={{ width: 100 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + Natija qo'shish
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item label="Fayl biriktirish (ixtiyoriy) — PDF, JPG, PNG">
            <Upload
              accept=".pdf,.jpg,.jpeg,.png"
              maxCount={1}
              beforeUpload={(file) => {
                setAttachmentFile(file);
                return false; // darhol yubormasin — tajriba yaratilgandan keyin biriktiramiz
              }}
              onRemove={() => setAttachmentFile(null)}
            >
              <Button icon={<UploadOutlined />}>Faylni tanlash</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* ---- Rad etish modali ---- */}
      <Modal
        title="Tajribani rad etish"
        open={!!rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onOk={handleReject}
        okText="Rad etish"
        okButtonProps={{ danger: true }}
        cancelText="Bekor qilish"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Rad etish sababini kiriting — bu laborantga ko'rinadi.
        </Text>
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" rules={[{ required: true, message: 'Sabab kiritilishi shart' }]}>
            <Input.TextArea rows={3} placeholder="masalan: natijalar birligi noto'g'ri kiritilgan" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ---- Batafsil ko'rish + holatni o'zgartirish ---- */}
      <Drawer
        title={detailRecord?.title || 'Tajriba'}
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        width={480}
        loading={detailLoading}
      >
        {detailRecord && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Namuna">
                <SpecimenTag tone="teal">{detailRecord.sample_id || '—'}</SpecimenTag>
              </Descriptions.Item>
              <Descriptions.Item label="Holat">
                <ExperimentStatusChip status={detailRecord.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Metod">{detailRecord.method || '—'}</Descriptions.Item>
              <Descriptions.Item label="Maqsad">{detailRecord.objective || '—'}</Descriptions.Item>
              <Descriptions.Item label="Kuzatuvlar">{detailRecord.observations || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ishlatilgan reaktivlar">
                {(detailRecord.chemicals_used || []).length > 0 ? (
                  <Space wrap>
                    {detailRecord.chemicals_used.map((id) => (
                      <Tag key={id}>{chemicalName(id)}</Tag>
                    ))}
                  </Space>
                ) : '—'}
              </Descriptions.Item>
              {detailRecord.status === 'rejected' && (
                <Descriptions.Item label="Rad etish sababi">
                  {detailRecord.rejection_reason || '—'}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Bajaruvchi">{detailRecord.performed_by_name || '—'}</Descriptions.Item>
              {detailRecord.approved_by_name && (
                <Descriptions.Item label="Tasdiqlagan">{detailRecord.approved_by_name}</Descriptions.Item>
              )}
            </Descriptions>

            {detailRecord.results && Object.keys(detailRecord.results).length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>Natijalar</Title>
                <Descriptions column={1} size="small" bordered>
                  {Object.entries(detailRecord.results).map(([key, r]) => (
                    <Descriptions.Item label={key} key={key}>
                      {r?.value} {r?.unit}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}

            <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>Biriktirilgan fayl</Title>
            {detailRecord.attachment ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <a href={detailRecord.attachment} target="_blank" rel="noreferrer">
                  <PaperClipOutlined /> Faylni ko'rish / yuklab olish
                </a>
                {detailRecord.status !== 'approved' && (
                  <Upload
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => { handleAttachmentUpload(file); return false; }}
                  >
                    <Button size="small" icon={<UploadOutlined />} loading={uploadingAttachment}>
                      Faylni almashtirish
                    </Button>
                  </Upload>
                )}
              </Space>
            ) : detailRecord.status !== 'approved' ? (
              <Upload
                accept=".pdf,.jpg,.jpeg,.png"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => { handleAttachmentUpload(file); return false; }}
              >
                <Button size="small" icon={<UploadOutlined />} loading={uploadingAttachment}>
                  Fayl biriktirish
                </Button>
              </Upload>
            ) : (
              <Text type="secondary">Fayl biriktirilmagan</Text>
            )}

            <div style={{ marginTop: 24 }}>
              <RoleGuard allow={['admin', 'chemist', 'laborant']}>
                {NEXT_STATUS[detailRecord.status] && (
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    loading={transitioning}
                    onClick={() => handleAdvance(detailRecord)}
                    block
                  >
                    {NEXT_STATUS[detailRecord.status].label}
                  </Button>
                )}
              </RoleGuard>

              {detailRecord.status === 'review' && (
                <RoleGuard allow={['admin', 'chemist']}>
                  <Space style={{ marginTop: 8, width: '100%' }}>
                    <Popconfirm title="Tajribani tasdiqlaysizmi?" onConfirm={() => handleApprove(detailRecord.id)}>
                      <Button icon={<CheckOutlined />} style={{ color: 'var(--lab-teal)' }}>
                        Tasdiqlash
                      </Button>
                    </Popconfirm>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => setRejectTarget(detailRecord)}
                    >
                      Rad etish
                    </Button>
                  </Space>
                </RoleGuard>
              )}

              {detailRecord.status === 'approved' && (
                <Empty description="Tajriba tasdiqlangan — endi tahrirlab bo'lmaydi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}