import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
console.log("url>>>", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "An unexpected error",
      data: error.response?.data?.data || null,
    };

    const enhancedError = new Error(errorResponse.message);
    enhancedError.response = { data: errorResponse };
    enhancedError.status = errorResponse.status;

    return Promise.reject(enhancedError);
  }
);

export const classroomAPI = {
  getAllClassrooms: () => api.get("/classroom"),

  getClassroomStatus: (roomId, role) =>
    api.get(`/classroom/${roomId}/status`, {
      params: { role },
    }),

  getClassroomReports: (roomId) => api.get(`/classroom/${roomId}/reports`),

  createClassroom: (roomId, role) => api.post("/classroom", { roomId, role }),
};

export default api;
