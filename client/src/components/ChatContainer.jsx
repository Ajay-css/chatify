import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils.js";

const ChatContainer = () => {
  // ✅ Zustand selectors
  const messages = useChatStore((state) => state.messages);
  const getMessages = useChatStore((state) => state.getMessages);
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
  const updateMessagesAsSeen = useChatStore((state) => state.updateMessagesAsSeen);

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // Load messages + subscribe
  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);

    if (socket) {
      subscribeToMessages();

      // ✅ listen for "messagesSeen"
      socket.on("messagesSeen", ({ userId, seenAt }) => {
        updateMessagesAsSeen(userId, seenAt);
      });
    }

    return () => {
      if (socket) {
        unsubscribeFromMessages();
        socket.off("messagesSeen");
      }
    };
  }, [
    selectedUser?._id,
    socket,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateMessagesAsSeen,
  ]);

  // Auto scroll on new messages
  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a user to start chatting
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isLastMessageByMe =
            message.senderId === authUser._id &&
            index === messages.length - 1;

          return (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="chat-bubble flex flex-col">
                {/* Image */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}

                {/* Video */}
                {message.fileType === "video" && message.fileUrl && (
                  <video controls className="sm:max-w-[250px] rounded-md mb-2">
                    <source src={message.fileUrl} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                )}

                {/* PDF */}
                {message.fileType === "pdf" && message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    📄 View PDF
                  </a>
                )}

                {/* Other files */}
                {message.fileType &&
                  !["video", "pdf", "image"].includes(message.fileType) && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      📂 Download File
                    </a>
                  )}

                {/* Text */}
                {message.text && <p>{message.text}</p>}
              </div>

              {/* ✅ Seen info */}
              {isLastMessageByMe && message.seen && message.seenAt && (
                <div className="text-xs text-blue-500 mt-1 ml-auto">
                  Seen {formatMessageTime(message.seenAt)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;