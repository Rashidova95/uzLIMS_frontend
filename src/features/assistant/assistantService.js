import axiosInstance from '../../api/axiosInstance';

const assistantService = {
  /**
   * @param {string} message - foydalanuvchi xabari
   * @param {{role: 'user'|'assistant', content: string}[]} history - suhbat tarixi
   * (backend oxirgi 10 tasini oladi, shuning uchun bu yerda cheklashning
   * hojati yo'q, lekin juda uzun bo'lmasin deb oxirgi 20 tasini yuboramiz)
   */
  async sendMessage(message, history = []) {
    const { data } = await axiosInstance.post('/assistant/chat/', {
      message,
      history: history.slice(-20),
    });
    return data; // { reply }
  },
};

export default assistantService;
