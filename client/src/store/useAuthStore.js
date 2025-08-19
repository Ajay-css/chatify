import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://chatify-backend-zowh.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ✅ Auth Check
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check", {
        withCredentials: true, // ✅ fixed typo
      });
      set({ authUser: res.data });

      // ✅ Auto connect socket when user is already logged in
      if (res.data) {
        get().connectSocket();
      }
    } catch (error) {
      console.log("Error in Check Auth :" + error.message);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ✅ Signup
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data, {
        withCredentials: true, // ✅ ensure cookie is set
      });
      set({ authUser: res.data });
      toast.success("Account created successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ✅ Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data, {
        withCredentials: true, // ✅ send cookies
      });
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ✅ Logout
  logout: async () => {
    try {
      await axiosInstance.post(
        "/auth/logout",
        {},
        { withCredentials: true } // ✅ clear cookies
      );
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");

      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // ✅ Update Profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data, {
        withCredentials: true, // ✅ include cookies
      });
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // ✅ Socket Connect
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    if (socket?.connected) return; // avoid duplicate connections

    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
    });

    newSocket.connect();
    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ onlineUsers: [] });
    });
  },

  // ✅ Socket Disconnect
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));