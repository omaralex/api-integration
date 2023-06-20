import axios from "axios";

const HttpClient = (() => {
  let instance;

  const createInstance = () => {
    const axiosInstance = axios.create({
      baseURL: `${process.env.BASE_URL}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `${process.env.ACCESS_TOKEN}`,
      },
    });
    return axiosInstance;
  };

  return {
    getInstance: () => {
      if (instance == null) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

export default HttpClient.getInstance();