import axiosInstance from '../../api/axiosInstance';

const experimentService = {
  async list(params = {}) {
    const { data } = await axiosInstance.get('/experiments/', { params });
    return data;
  },

  async getById(id) {
    const { data } = await axiosInstance.get(`/experiments/${id}/`);
    return data;
  },

  async create(payload) {
    // payload: { sample, title, method, objective, observations, results, chemicals_used }
    const { data } = await axiosInstance.post('/experiments/create/', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await axiosInstance.patch(`/experiments/${id}/update/`, payload);
    return data;
  },

  async uploadAttachment(id, file) {
    // Alohida so'rov — asosiy JSON maydonlar (natijalar, reaktivlar) bilan
    // aralashtirmaslik uchun faqat faylni multipart/form-data orqali yuboradi.
    const formData = new FormData();
    formData.append('attachment', file);
    const { data } = await axiosInstance.patch(`/experiments/${id}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async approve(id) {
    const { data } = await axiosInstance.patch(`/experiments/${id}/approve/`, {});
    return data;
  },

  async reject(id, reason) {
    const { data } = await axiosInstance.patch(`/experiments/${id}/reject/`, {
      rejection_reason: reason,
    });
    return data;
  },
};

export default experimentService;
