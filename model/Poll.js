import mongoose from "mongoose";
const pollingDb = mongoose.connection.useDb("PollingSystem");

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  createdBy: {
    // type: mongoose.Schema.Types.ObjectId,
    type: String,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Poll = pollingDb.model("Poll", PollSchema, "Poll");
export default Poll;
