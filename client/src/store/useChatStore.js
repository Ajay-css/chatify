// src/store/useChatStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast"; // ✅ Add toast

export const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  unreadMessages: {},

  isUsersLoading: false,
  isMessagesLoading: false,

  socket: null,

  getUsers: async () => {
    try {
      set({ isUsersLoading: true });
      const res = await axios.get("/api/users");
      set({ users: res.data, isUsersLoading: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ isUsersLoading: false });
    }
  },

  setSelectedUser: (user) => {
    const { unreadMessages } = get();
    const updatedUnread = { ...unreadMessages };
    delete updatedUnread[user._id]; // reset unread

    set({
      selectedUser: user,
      unreadMessages: updatedUnread,
    });
  },

  getMessages: async (userId) => {
    try {
      set({ isMessagesLoading: true });
      const res = await axios.get(`/api/messages/${userId}`);
      set({ messages: res.data, isMessagesLoading: false });
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (receiverId, content, type = "text") => {
    try {
      const res = await axios.post("/api/messages", {
        receiverId,
        content,
        type,
      });

      set((state) => ({
        messages: [...state.messages, res.data],
      }));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },

  connectSocket: () => {
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    socket.on("newMessage", (message) => {
      const { selectedUser, unreadMessages, users } = get();

      if (selectedUser && selectedUser._id === message.senderId) {
        // Chat is open → show in chat directly
        set((state) => ({
          messages: [...state.messages, message],
        }));
      } else {
        // Chat not open → increment unread + show toast
        set({
          unreadMessages: {
            ...unreadMessages,
            [message.senderId]: (unreadMessages[message.senderId] || 0) + 1,
          },
        });

        // ✅ Find sender name for toast
        const sender = users.find((u) => u._id === message.senderId);
        toast.success(`New message from ${sender?.fullName || "Someone"}`);
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null });
  },
}));