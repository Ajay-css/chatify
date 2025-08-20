import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    image: { type: String },       // ✅ old (for backward compatibility)
    fileUrl: { type: String },     // ✅ new (for video/pdf/etc.)
    fileType: { type: String },    // ✅ (image, video, pdf, raw)
    seen: { type: Boolean, default: false },
    seenAt: { type: Date },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
