import axiosInstance from '../../api/axiosInstance';

const sampleService = {
  async list(params = {}) {
    // params: { search, status, source_type, date_from, date_to, page }
    const { data } = await axiosInstance.get('/samples/', { params });
    return data;
  },

  async getById(id) {
    const { data } = await axiosInstance.get(`/samples/${id}/`);
    return data;
  },

  async create(payload) {
    // payload: { name, source_type, quantity, unit, notes }
    const { data } = await axiosInstance.post('/samples/create/', payload);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await axiosInstance.patch(`/samples/${id}/status/`, { status });
    return data;
  },

  async exportCsv(params = {}) {
    const response = await axiosInstance.get('/samples/export/csv/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default sampleService;
