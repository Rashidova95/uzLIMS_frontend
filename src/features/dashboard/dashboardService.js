import axiosInstance from '../../api/axiosInstance';

const dashboardService = {
  async stats() {
    const { data } = await axiosInstance.get('/dashboard/stats/');
    return data;
  },

  async exposure(days = 90) {
    // Faqat admin/chemist ko'ra oladi (backend IsChemist tekshiradi).
    // Javob: { period_days, threshold, results: [{ user_id, name, email,
    //          total_exposures, high_hazard_exposures, over_threshold }] }
    const { data } = await axiosInstance.get('/dashboard/exposure/', { params: { days } });
    return data;
  },
};

export default dashboardService;
