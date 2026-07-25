import axiosInstance from '../../api/axiosInstance';

const dashboardService = {
  async stats() {
    const { data } = await axiosInstance.get('/dashboard/stats/');
    return data;
  },
};

export default dashboardService;
