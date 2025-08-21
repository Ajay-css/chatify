import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUser: null,
  isFetchingMessages: false,

  // 📩 Set Selected User
  setSelectedUser: (user) => set({ selectedUser: user }),

  // 📥 Get Messages
  getMessages: async (userId) => {
    set({ isFetchingMessages: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      console.log("Error in getMessages:", error);
    } finally {
      set({ isFetchingMessages: false });
    }
  },

  // 📤 Send Message
  sendMessage: async (receiverId, text, image) => {
    try {
      const res = await axiosInstance.post("/messages/send", {
        receiverId,
        text,
        image,
      });
      set({ messages: [...get().messages, res.data] });
    } catch (error) {
      console.log("Error in sendMessage:", error);
    }
  },
}));