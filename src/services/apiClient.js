import axios from "axios";
import {keycloak} from "./keycloak.js"

/// Cấu hình chung.
const API_BASE_URL = "http://localhost:8080/";
const PROD_API_BASE_URL = "https://www.moviereservation.software/";

/// Tạo instance tập trung.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 20000, // 20 seconds
});

/* 
- Lưu ý rằng hàm refreshToken phải được thực hiện synchronously.
- Nếu không newAccessToken sẽ là một Promise object và khi retry sẽ không hợp lệ.
- Do đó, ta cần await hàm refreshToken để lấy giá trị trả về là newAccessToken.

- Sau khi có newAccessToken, ta cần lưu nó vào localStorage.
- Tiếp đó, điều chỉnh lại Authorization header của error trước khi retry.
- Tận dụng error object này, vì error object này bản chất là một request object với mã lỗi thay vì thành công.
- Cuối cùng, ta gọi lại apiClient với config của error object.
*/

/// Interceptors cho request.
apiClient.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    if (keycloak.token) {
      config.headers["Authorization"] = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default apiClient;