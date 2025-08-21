import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore.js";
import { useChatStore } from "../store/chatStore.js";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils.js";

const ChatContainer = ({ selectedUser }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateMessagesAsSeen,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // ⬇️ Auto-scroll when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 📩 Fetch messages + handle socket events
  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);

    if (socket) {
      subscribeToMessages(socket);

      socket.emit("markMessagesAsSeen", { userId: selectedUser._id });

      socket.on("messagesSeen", ({ userId, seenAt }) => {
        if (userId === selectedUser._id) {
          updateMessagesAsSeen(userId, seenAt);
        }
      });
    }

    return () => {
      if (socket) {
        unsubscribeFromMessages(socket);
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

  return (
    <div className="flex flex-col h-full">
      {/* ✅ Old ChatHeader restored */}
      {selectedUser && <ChatHeader user={selectedUser} />}

      <div className="chat-container flex-1 p-4 overflow-y-auto">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === authUser._id ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-bubble">
                {/* ✅ Handle both text/content */}
                {message.text || message.content ? (
                  <p>{message.text || message.content}</p>
                ) : null}

                {/* Image */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="attachment"
                    className="max-w-xs rounded-md mt-2"
                  />
                )}

                {/* Video */}
                {message.fileType === "video" && message.fileUrl && (
                  <video controls className="max-w-xs rounded-md mt-2">
                    <source src={message.fileUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}

                {/* Document */}
                {message.fileType === "document" && message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline mt-2 block"
                  >
                    View Document
                  </a>
                )}

                {/* ✅ Old feature: show time */}
                <span className="text-xs text-gray-400 ml-2">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
        {/* ✅ Ref outside loop */}
        <div ref={messageEndRef} />
      </div>

      {/* ✅ Old MessageInput restored */}
      {selectedUser && <MessageInput receiverId={selectedUser._id} />}
    </div>
  );
};

export default ChatContainer;