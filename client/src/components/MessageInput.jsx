import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null); // for image/video
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const type = selectedFile.type.split("/")[0];
    setFileType(type);
    setFile(selectedFile);

    if (type === "image") {
      const reader = new FileReader();
      reader.onloadend = () => setPreview({ type: "image", src: reader.result });
      reader.readAsDataURL(selectedFile);
    } else if (type === "video") {
      const videoURL = URL.createObjectURL(selectedFile);
      setPreview({ type: "video", src: videoURL });
    } else {
      setPreview(null); // pdf/docs won't have preview
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileType(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file && !preview) return;

    try {
      await sendMessage({
        text: text.trim(),
        file,
        fileType,
      });

      // Clear form
      setText("");
      removeFile();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {preview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {preview.type === "image" && (
              <img
                src={preview.src}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            )}
            {preview.type === "video" && (
              <video
                src={preview.src}
                className="w-28 h-20 object-cover rounded-lg border border-zinc-700"
                controls
              />
            )}

            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* File input for all types */}
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {/* Button visible on all screens */}
          <button
            type="button"
            className={`btn btn-circle ${file || preview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !file && !preview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;