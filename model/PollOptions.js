import mongoose from "mongoose";
const pollingDb = mongoose.connection.useDb("PollingSystem");

const OptionSchema = new mongoose.Schema({
  pollId: { type: String, ref: "Poll", required: true },
  name: { type: String, required: true, trim: true },
  votes: { type: Number, default: 0 }, // Tracks total votes for this option
});

const Option = pollingDb.model("Option", OptionSchema, "PollOptions");
export default Option;
