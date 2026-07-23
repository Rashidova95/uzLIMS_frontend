import axiosInstance from '../../api/axiosInstance';

const chemicalService = {
  async list(params = {}) {
    const { data } = await axiosInstance.get('/chemicals/', { params });
    return data;
  },

  async getById(id) {
    const { data } = await axiosInstance.get(`/chemicals/${id}/`);
    return data;
  },

  async create(payload) {
    // payload: { name_uz, name_iupac, cas_number, quantity, unit,
    //            min_threshold, expiry_date, hazard_level, supplier }
    const { data } = await axiosInstance.post('/chemicals/create/', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await axiosInstance.patch(`/chemicals/${id}/update/`, payload);
    return data;
  },

  async updateQuantity(id, action, amount) {
    // Backend shu shaklni kutadi: { action: 'add' | 'subtract', amount }
    const { data } = await axiosInstance.patch(`/chemicals/${id}/quantity/`, { action, amount });
    return data;
  },

  async deactivate(id) {
    const { data } = await axiosInstance.patch(`/chemicals/${id}/deactivate/`, {});
    return data;
  },

  async activate(id) {
    const { data } = await axiosInstance.patch(`/chemicals/${id}/activate/`, {});
    return data;
  },

  async alerts() {
    const { data } = await axiosInstance.get('/chemicals/alerts/');
    return data;
  },
};

export default chemicalService;
