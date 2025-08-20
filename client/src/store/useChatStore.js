import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios.js";
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
      const res = await axiosInstance.get("/messages/users");
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
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data, isMessagesLoading: false });
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
      set({ isMessagesLoading: false });
    }
  },

  // ✅ Set selected user + clear unread messages
  setSelectedUser: (user) => {
    set((state) => {
      const newUnread = { ...state.unreadMessages };
      if (newUnread[user._id]) {
        delete newUnread[user._id]; // clear unread count
      }
      return { selectedUser: user, unreadMessages: newUnread };
    });
  },

  // ✅ Send message (text, image, file)
  sendMessage: async (receiverId, content, type = "text") => {
    try {
      const res = await axiosInstance.post(`/messages/${receiverId}`, { content, type });
      set((state) => ({
        messages: [...state.messages, res.data],
      }));

      const { socket } = get();
      if (socket) socket.emit("sendMessage", res.data);
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  },

  // ✅ Initialize socket
  initSocket: () => {
    const { socket } = get();
    if (socket) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
    });

    // incoming message
    newSocket.on("receiveMessage", (message) => {
      const { selectedUser } = get();

      if (selectedUser?._id === message.senderId) {
        // already chatting with this user
        set((state) => ({
          messages: [...state.messages, message],
        }));
      } else {
        // increment unread count
        set((state) => {
          const unread = { ...state.unreadMessages };
          unread[message.senderId] = (unread[message.senderId] || 0) + 1;
          return { unreadMessages: unread };
        });
        toast.success("New message received!");
      }
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // ✅ Subscribe to socket messages
  subscribeToMessages: () => {
    const { socket } = get();
    if (!socket) return;

    socket.on("receiveMessage", (message) => {
      const { selectedUser } = get();

      if (selectedUser?._id === message.senderId) {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      } else {
        set((state) => {
          const unread = { ...state.unreadMessages };
          unread[message.senderId] = (unread[message.senderId] || 0) + 1;
          return { unreadMessages: unread };
        });
        toast.success("New message received!");
      }
    });
  },

  // ✅ Unsubscribe to prevent memory leaks
  unsubscribeFromMessages: () => {
    const { socket } = get();
    if (socket) {
      socket.off("receiveMessage");
    }
  },

  // ✅ Update messages as seen
  updateMessagesAsSeen: (userId, seenAt) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.senderId === userId ? { ...msg, seen: true, seenAt } : msg
      ),
    }));
  },
}));