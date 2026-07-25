import { useEffect, useState, useCallback } from 'react';
import { Table, Typography, Button, Input, message, Space } from 'antd';
import { FilePdfOutlined, SearchOutlined } from '@ant-design/icons';
import sampleService from '../features/samples/sampleService';
import reportService from '../features/reports/reportService';
import { downloadBlob } from '../utils/downloadBlob';
import SpecimenTag from '../components/common/SpecimenTag';
import { SampleStatusChip } from '../components/common/StatusChip';

const { Title, Text } = Typography;

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const fetchData = useCallback((page = 1) => {
    setLoading(true);
    const params = { page, status: 'completed' };
    if (search) params.search = search;
    sampleService
      .list(params)
      .then((res) => {
        const results = res.results ?? res;
        setData(Array.isArray(results) ? results : []);
        setPagination((p) => ({ ...p, current: page, total: res.count ?? results.length ?? 0 }));
      })
      .catch(() => message.error("Namunalarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleDownload = async (sample) => {
    setPdfLoadingId(sample.id);
    try {
      const blob = await reportService.downloadSamplePdf(sample.id);
      downloadBlob(blob, `hisobot_${sample.sample_id}.pdf`, 'application/pdf');
      message.success('Hisobot yuklab olindi');
    } catch {
      message.error("Hisobot topilmadi — tajribalar hali tasdiqlanmagan bo'lishi mumkin");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const columns = [
    {
      title: 'Namuna ID',
      dataIndex: 'sample_id',
      width: 180,
      render: (v) => <SpecimenTag tone="teal">{v}</SpecimenTag>,
    },
    { title: 'Nomi', dataIndex: 'name', ellipsis: true },
    {
      title: 'Holat',
      dataIndex: 'status',
      width: 150,
      render: (status) => <SampleStatusChip status={status} />,
    },
    {
      title: 'Qabul sanasi',
      dataIndex: 'received_at',
      width: 130,
      render: (v) => (v ? new Date(v).toLocaleDateString('uz-UZ') : '—'),
    },
    {
      title: 'Hisobot',
      width: 140,
      render: (_, record) => (
        <Button
          size="small"
          icon={<FilePdfOutlined />}
          loading={pdfLoadingId === record.id}
          onClick={() => handleDownload(record)}
        >
          PDF yuklab olish
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Title level={4} style={{ marginBottom: 2 }}>Hisobotlar</Title>
        <Text type="secondary">Tugallangan namunalar bo'yicha PDF hisobotlar</Text>
      </div>

      <Space style={{ marginBottom: 14 }}>
        <Input
          placeholder="Namuna ID yoki nomi bo'yicha qidirish..."
          prefix={<SearchOutlined style={{ color: 'var(--ink-soft)' }} />}
          style={{ width: 280 }}
          allowClear
          onPressEnter={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page) => fetchData(page),
          showTotal: (total) => `Jami ${total} ta tugallangan namuna`,
        }}
      />
    </div>
  );
}
