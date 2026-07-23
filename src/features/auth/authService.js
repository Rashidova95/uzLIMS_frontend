import axiosInstance from '../../api/axiosInstance';

// Barcha yo'llar Swagger'da ko'rilgan haqiqiy endpointlarga mos:
// POST /auth/register/  POST /auth/login/  POST /auth/refresh/
// GET|PATCH /auth/me/   POST /auth/change-password/

const authService = {
  async register(payload) {
    // payload: { email, password, password2, first_name, last_name, ... }
    const { data } = await axiosInstance.post('/auth/register/', payload);
    return data;
  },

  async login(email, password) {
    const { data } = await axiosInstance.post('/auth/login/', { email, password });
    return data; // { access, refresh, ... }
  },

  async refresh(refreshToken) {
    const { data } = await axiosInstance.post('/auth/refresh/', { refresh: refreshToken });
    return data; // { access }
  },

  async getMe() {
    const { data } = await axiosInstance.get('/auth/me/');
    return data;
  },

  async updateMe(payload) {
    const { data } = await axiosInstance.patch('/auth/me/', payload);
    return data;
  },

  async changePassword(payload) {
    // payload: { old_password, new_password, new_password2 }
    const { data } = await axiosInstance.post('/auth/change-password/', payload);
    return data;
  },
};

export default authService;
