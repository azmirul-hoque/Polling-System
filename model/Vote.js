import mongoose from "mongoose";
const pollingDb = mongoose.connection.useDb("PollingSystem");

const VoteSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Option",
    required: true,
  },
  userId: { type: String, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Vote = pollingDb.model("Vote", VoteSchema, "Votes");
export default Vote;
