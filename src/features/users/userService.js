import axiosInstance from '../../api/axiosInstance';

const userService = {
  async list(params = {}) {
    const { data } = await axiosInstance.get('/auth/users/', { params });
    return data;
  },

  async getById(id) {
    const { data } = await axiosInstance.get(`/auth/users/${id}/`);
    return data;
  },

  async create(payload) {
    // payload: { email, username, first_name, last_name, password, role, lab_name, phone }
    const { data } = await axiosInstance.post('/auth/users/create/', payload);
    return data;
  },

  async update(id, payload) {
    // payload: { first_name, last_name, profile: { lab_name, phone } }
    const { data } = await axiosInstance.patch(`/auth/users/${id}/`, payload);
    return data;
  },

  async remove(id) {
    await axiosInstance.delete(`/auth/users/${id}/`);
  },

  async updateRole(id, payload) {
    // payload: { role } va/yoki { is_active }
    const { data } = await axiosInstance.patch(`/auth/users/${id}/role/`, payload);
    return data;
  },
};

export default userService;
