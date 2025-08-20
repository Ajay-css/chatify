import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
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
      const res = await axios.get("/api/users");
      set({ users: res.data, isUsersLoading: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ isUsersLoading: false });
    }
  },

  // ✅ Set selected chat user and reset unread
  setSelectedUser: (user) => {
    const { unreadMessages } = get();
    const updatedUnread = { ...unreadMessages };
    delete updatedUnread[user._id];

    set({
      selectedUser: user,
      unreadMessages: updatedUnread,
    });
  },

  // ✅ Fetch messages with a user
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

  // ✅ Send message (text, image, file)
  sendMessage: async (receiverId, content, type = "text") => {
    try {
      const res = await axios.post(`/api/messages/${receiverId}`, { content, type });
      set((state) => ({
        messages: [...state.messages, res.data],
      }));

      // Emit via socket
      const { socket } = get();
      if (socket) socket.emit("sendMessage", res.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },

  // ✅ Connect socket.io
  connectSocket: () => {
    const { authUser, users } = get();
    if (!authUser) return;

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });

    // Handle incoming messages
    socket.on("newMessage", (message) => {
      const { selectedUser, unreadMessages } = get();

      if (selectedUser && selectedUser._id === message.senderId) {
        // Chat is open → append directly
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

        const sender = users.find((u) => u._id === message.senderId);
        toast.success(`💬 New message from ${sender?.fullName || "Someone"}`);
      }
    });

    set({ socket });
    window.socket = socket; // ✅ global access
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null });
    window.socket = null;
  },
}));