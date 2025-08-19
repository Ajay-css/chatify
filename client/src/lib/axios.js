import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://chatify-backend-zowh.onrender.com/api",
    withCredentials: true,
})