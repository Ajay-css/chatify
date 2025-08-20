import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore.js";

const Sidebar = () => {
  const {
    users,
    getUsers,
    setSelectedUser,
    selectedUser,
    unreadMessages,
  } = useChatStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return (
    <div className="w-64 h-full bg-base-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Chats</h2>

      {users.length === 0 ? (
        <p className="text-sm text-gray-500">No users found</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition
                ${
                  selectedUser?._id === user._id
                    ? "bg-primary text-white"
                    : "bg-base-100 hover:bg-base-300"
                }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar with online indicator */}
                <div className="relative">
                  <img
                    src={user.profilePic || "/default-avatar.png"}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100"></span>
                  )}
                </div>

                {/* Name + status */}
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {user.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Unread badge */}
              {unreadMessages[user._id] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadMessages[user._id]}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;