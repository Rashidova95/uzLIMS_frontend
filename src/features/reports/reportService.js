import axiosInstance from '../../api/axiosInstance';

const reportService = {
  async downloadSamplePdf(sampleId) {
    const response = await axiosInstance.get(`/reports/samples/${sampleId}/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportService;
