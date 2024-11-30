import express from "express";
import Poll from "../model/Poll.js";
import Option from "../model/PollOptions.js";
import Vote from "../model/Vote.js";
import mongoose from "mongoose";
import authMiddleware from "../middleware.js";

const router = express.Router();

router.get("/poll-results", authMiddleware, (req, res) => {
  res.render("poll-res");
});

// Get poll results with aggregated vote data
router.get("/poll/results", async (req, res) => {
  try {
    // Get all polls from the database
    const pollingDb = mongoose.connection.useDb("PollingSystem");
    const Poll_question = await pollingDb.collection("Poll").find({}).toArray();

    // Generate poll results in a pretty format
    const genPollPrettyData = await Promise.all(
      Poll_question.map(async (q) => {
        try {
          const pollId = q._id;

          // Get total votes for the poll
          const totalVotes = await Vote.countDocuments({ pollId });

          // Get all options for this poll
          const options = await Option.find({ pollId });

          // Aggregate votes for each option
          const optionVotes = await Vote.aggregate([
            { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
            { $group: { _id: "$optionId", count: { $sum: 1 } } },
          ]);

          // Map the aggregated data to options and calculate percentages
          const results = options.map((option) => {
            const voteData = optionVotes.find(
              (v) => v._id.toString() === option._id.toString()
            );
            const votes = voteData ? voteData.count : 0;
            const percentage = totalVotes
              ? ((votes / totalVotes) * 100).toFixed(2)
              : "0.00";
            return {
              optionId: option._id,
              name: option.name,
              votes,
              percentage,
            };
          });

          return {
            pollId,
            question: q.question,
            createdBy: q.createdBy,
            createdAt: q.createdAt,
            totalVotes,
            options: results,
          };
        } catch (err) {
          console.error(`Error processing poll with ID ${q._id}:`, err);
          return null; // Skip the poll if there's an error
        }
      })
    );

    // Filter out any null results (polls that failed to process)
    const filteredResults = genPollPrettyData.filter((poll) => poll !== null);

    // Send the formatted response
    res.json(filteredResults);
  } catch (err) {
    console.error("Error fetching poll results:", err);
    res.status(500).json({ message: "Failed to fetch poll results" });
  }
});

export default router;
