import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios.js";  // ✅ use your configured axios
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  unreadMessages: {},

  isUsersLoading: false,
  isMessagesLoading: false,

  socket: null,

  // ✅ Fetch all users except logged-in
  getUsers: async () => {
    try {
      set({ isUsersLoading: true });
      const res = await axiosInstance.get("/messages/users"); // ✅ use axiosInstance
      set({ users: res.data, isUsersLoading: false });
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      set({ isUsersLoading: false });
    }
  },

  // ✅ Fetch messages with a user
  getMessages: async (userId) => {
    try {
      set({ isMessagesLoading: true });
      const res = await axiosInstance.get(`/messages/${userId}`); // ✅ use axiosInstance
      set({ messages: res.data, isMessagesLoading: false });
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
      set({ isMessagesLoading: false });
    }
  },

  // ✅ Send message (text, image, file)
  sendMessage: async (receiverId, content, type = "text") => {
    try {
      const res = await axiosInstance.post(`/messages/${receiverId}`, { content, type }); // ✅ use axiosInstance
      set((state) => ({
        messages: [...state.messages, res.data],
      }));

      const { socket } = get();
      if (socket) socket.emit("sendMessage", res.data);
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  },

  // socket functions remain same...
}));