import { useEffect, useState, useCallback } from 'react';
import {
  Table, Input, Select, Button, Typography, Modal, Form, InputNumber,
  message, Space, Tooltip, Drawer, Descriptions, Timeline, Empty,
} from 'antd';
import {
  PlusOutlined, DownloadOutlined, SearchOutlined, FilePdfOutlined, EyeOutlined,
} from '@ant-design/icons';
import sampleService from '../features/samples/sampleService';
import reportService from '../features/reports/reportService';
import { downloadBlob } from '../utils/downloadBlob';
import SpecimenTag from '../components/common/SpecimenTag';
import { SampleStatusChip, SAMPLE_STATUS_OPTIONS } from '../components/common/StatusChip';
import RoleGuard from '../components/common/RoleGuard';

const { Title, Text } = Typography;

const SOURCE_OPTIONS = [
  { value: 'industrial', label: 'Sanoat' },
  { value: 'field', label: 'Dala' },
  { value: 'medical', label: 'Tibbiy' },
  { value: 'educational', label: "O'quv" },
];

const SOURCE_TONE = { industrial: 'blue', field: 'teal', medical: 'red', educational: 'amber' };

// Backend'dagi Sample.STATUS_ORDER bilan bir xil — status faqat shu ketma-ketlikda,
// bittalab oldinga o'tishi mumkin (orqaga yoki sakrab o'tish taqiqlangan).
const SAMPLE_STATUS_ORDER = ['received', 'in_progress', 'completed', 'archived'];

export default function Samples() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [sourceFilter, setSourceFilter] = useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (sourceFilter) params.source_type = sourceFilter;

    sampleService
      .list(params)
      .then((res) => {
        const results = res.results ?? res;
        setData(Array.isArray(results) ? results : []);
        setPagination((p) => ({ ...p, current: page, total: res.count ?? results.length ?? 0 }));
      })
      .catch(() => message.error("Namunalarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      await sampleService.create(values);
      message.success('Namuna yaratildi');
      setModalOpen(false);
      form.resetFields();
      fetchData(1);
    } catch (err) {
      const errs = err.response?.data;
      const firstError = errs ? Object.values(errs).flat()[0] : null;
      message.error(firstError || "Namuna yaratib bo'lmadi");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await sampleService.updateStatus(id, status);
      message.success('Holat yangilandi');
      fetchData(pagination.current);
    } catch (err) {
      message.error(err.response?.data?.status?.[0] || "Holatni yangilab bo'lmadi");
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await sampleService.exportCsv({
        search: search || undefined,
        status: statusFilter,
        source_type: sourceFilter,
      });
      downloadBlob(blob, `namunalar_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } catch {
      message.error("CSV eksport qilinmadi");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = async (sample) => {
    setPdfLoadingId(sample.id);
    try {
      const blob = await reportService.downloadSamplePdf(sample.id);
      downloadBlob(blob, `hisobot_${sample.sample_id}.pdf`, 'application/pdf');
    } catch {
      message.error("PDF hisobot mavjud emas — tajribalar tasdiqlanmagan bo'lishi mumkin");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const openDetail = async (record) => {
    setDetailRecord({ ...record });
    setDetailLoading(true);
    try {
      const full = await sampleService.getById(record.id);
      setDetailRecord(full);
    } catch {
      message.error("Namuna tafsilotlarini yuklab bo'lmadi");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'Namuna ID',
      dataIndex: 'sample_id',
      width: 180,
      render: (id, record) => (
        <SpecimenTag tone={SOURCE_TONE[record.source_type] || 'slate'}>{id}</SpecimenTag>
      ),
    },
    { title: 'Nomi', dataIndex: 'name', ellipsis: true },
    {
      title: 'Manba',
      dataIndex: 'source_type',
      width: 110,
      render: (v) => SOURCE_OPTIONS.find((o) => o.value === v)?.label || v,
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      width: 190,
      render: (status, record) => {
        const currentIndex = SAMPLE_STATUS_ORDER.indexOf(status);
        const allowedOptions = SAMPLE_STATUS_OPTIONS.filter((o) => {
          const idx = SAMPLE_STATUS_ORDER.indexOf(o.value);
          return idx === currentIndex || idx === currentIndex + 1;
        });
        return (
          <RoleGuard allow={['admin', 'chemist', 'laborant']}>
            <Select
              size="small"
              value={status}
              variant="borderless"
              style={{ width: 160 }}
              options={allowedOptions}
              disabled={currentIndex === SAMPLE_STATUS_ORDER.length - 1}
              onChange={(val) => handleStatusChange(record.id, val)}
              optionRender={(opt) => <SampleStatusChip status={opt.value} />}
              labelRender={() => <SampleStatusChip status={status} />}
            />
          </RoleGuard>
        );
      },
    },
    {
      title: 'Miqdor',
      width: 100,
      render: (_, r) => <span className="mono">{r.quantity} {r.unit}</span>,
    },
    {
      title: 'Qabul sanasi',
      dataIndex: 'received_at',
      width: 120,
      render: (v) => (v ? new Date(v).toLocaleDateString('uz-UZ') : '—'),
    },
    {
      title: '',
      width: 80,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="Batafsil ko'rish">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDetail(record)}
            />
          </Tooltip>
          <Tooltip title="PDF hisobot">
            <Button
              type="text"
              size="small"
              icon={<FilePdfOutlined />}
              loading={pdfLoadingId === record.id}
              onClick={() => handleDownloadPdf(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ marginBottom: 2 }}>Namunalar</Title>
          <Text type="secondary">Laboratoriyaga qabul qilingan barcha namunalar</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExportCsv}>
            CSV
          </Button>
          <RoleGuard allow={['admin', 'chemist', 'laborant']}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Yangi namuna
            </Button>
          </RoleGuard>
        </Space>
      </div>

      <Space style={{ marginBottom: 14 }} wrap>
        <Input
          placeholder="Namuna ID yoki nomi bo'yicha qidirish..."
          prefix={<SearchOutlined style={{ color: 'var(--ink-soft)' }} />}
          style={{ width: 260 }}
          allowClear
          onPressEnter={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          placeholder="Barcha holat"
          allowClear
          style={{ width: 160 }}
          options={SAMPLE_STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        <Select
          placeholder="Barcha manba"
          allowClear
          style={{ width: 150 }}
          options={SOURCE_OPTIONS}
          onChange={setSourceFilter}
        />
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
          showTotal: (total) => `Jami ${total} ta namuna`,
        }}
      />

      <Modal
        title="Yangi namuna qabul qilish"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Namuna nomi" rules={[{ required: true }]}>
            <Input placeholder="masalan: Tuproq namunasi #12" />
          </Form.Item>
          <Form.Item name="source_type" label="Manba turi" rules={[{ required: true }]}>
            <Select options={SOURCE_OPTIONS} placeholder="Tanlang" />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="quantity" label="Miqdor" rules={[{ required: true }]} style={{ width: '60%' }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            <Form.Item name="unit" label="Birlik" rules={[{ required: true }]} style={{ width: '40%' }}>
              <Select
                options={[
                  { value: 'g', label: 'g — Gram' },
                  { value: 'mg', label: 'mg — Milligram' },
                  { value: 'ml', label: 'ml — Millilitr' },
                  { value: 'l', label: 'l — Litr' },
                ]}
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="notes" label="Izohlar (ixtiyoriy)">
            <Input.TextArea rows={2} placeholder="Qo'shimcha ma'lumot..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ---- Batafsil ko'rish ---- */}
      <Drawer
        title={detailRecord ? <SpecimenTag tone={SOURCE_TONE[detailRecord.source_type] || 'slate'}>{detailRecord.sample_id}</SpecimenTag> : "Namuna"}
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        width={440}
        loading={detailLoading}
      >
        {detailRecord && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Nomi">{detailRecord.name}</Descriptions.Item>
              <Descriptions.Item label="Manba turi">
                {SOURCE_OPTIONS.find((o) => o.value === detailRecord.source_type)?.label || detailRecord.source_type}
              </Descriptions.Item>
              <Descriptions.Item label="Holat">
                <SampleStatusChip status={detailRecord.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Miqdor">
                <span className="mono">{detailRecord.quantity} {detailRecord.unit}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Qabul qilgan">
                {detailRecord.received_by?.name || detailRecord.received_by?.email || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Qabul sanasi">
                {detailRecord.received_at || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Izohlar">
                {detailRecord.notes || <Text type="secondary">Izoh kiritilmagan</Text>}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>Holat tarixi</Title>
            {detailRecord.logs && detailRecord.logs.length > 0 ? (
              <Timeline
                items={detailRecord.logs.map((log) => ({
                  children: (
                    <div>
                      <div>
                        <SampleStatusChip status={log.old_status} /> → <SampleStatusChip status={log.new_status} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {log.changed_at} {log.changed_by ? `· ${log.changed_by}` : ''}
                      </Text>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="Hali holat o'zgarishi bo'lmagan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}