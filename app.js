import express from "express";
import dotenv from "dotenv";
import loginSuccess from "./loginSuccess.js";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import validator from "validator";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";
import mongooseConnect from "./mongoConnection/mongo.js";
import Poll from "./model/Poll.js";
import Option from "./model/PollOptions.js";
import Vote from "./model/Vote.js";
import cors from "cors";
import authMiddleware from "./middleware.js";
import router from "./router/poll-results.js";

// Create equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const auth_sup_key = process.env.Auth_Super_SecretKey;
// Allow requests from specific origins
const corsOptions = {
  origin: [
    "http://localhost:5000", // Your local backend
    "https://xffxx10j-5000.inc1.devtunnels.ms", // Your frontend devtunnel
  ],
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  credentials: true, // Allow cookies and authentication headers
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));
app.use(bodyParser.json());
app.use("/", router);

const usersFilePath = path.join(__dirname, "users.json");
const getUsersData = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([])); // Create file if it doesn't exist
  }
  const data = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(data);
};

const saveUserData = (data) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
};

function validateEmail(param) {
  const disallowedCharacters = /[<>\/%=+\-\[\]{}()|\\'";&*%$#!~`]/;
  if (disallowedCharacters.test(param)) {
    return true;
  }
  return false;
}
app.get("/login", (req, res) => {
  res.render("loginForm");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`Email Recieved: ${email}`);
  console.log(`Password Recieved: ${password}`);
  const sanitized_email = validator.escape(email.trim());
  const sanitized_password = validator.escape(password.trim());

  console.log(`Sanitized Email Recieved: ${email}`);
  console.log(`Sanitized Password Recieved: ${password}`);

  const users = getUsersData();
  const existingUser = users.find(
    (user) => user.email === sanitized_email && user.password === password
  );

  if (existingUser) {
    console.log(
      existingUser.email,
      existingUser.username,
      existingUser.password
    );
    const payload = {
      username: existingUser.username,
      email: existingUser.email,
    };

    const token = jwt.sign(payload, auth_sup_key, { expiresIn: "1h" });
    console.log(token);
    console.log(auth_sup_key);

    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 3600000,
    });
    console.log("Saved Token In the cookies");

    res.send(loginSuccess);
  }

  if (!existingUser) {
    return res.send("User not Exist, Please Sign Up");
  }
});

app.get("/signup", (req, res) => {
  res.render("signUpForm");
});
app.post("/signup", (req, res) => {
  const { username, password, email } = req.body;
  const sanitized_username = validator.escape(username.trim());
  const sanitized_password = validator.escape(password.trim());
  const sanitized_email = validator.escape(email.trim());

  const users = getUsersData();
  const existingUser = users.find((user) => user.email === sanitized_email);
  if (existingUser) {
    return res.status(400).send("User already exists!");
  }

  const checkValidation = validateEmail(email);
  if (checkValidation) {
    return res.send(`Invalid Email`);
  }

  const newUser = {
    username: sanitized_username,
    email: sanitized_email,
    password: sanitized_password,
  };
  users.push(newUser);
  saveUserData(users);

  res.status(201).send("Signup successful!");
});

app.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.redirect("/");
});

app.get("/", authMiddleware, (req, res) => {
  // const token = req.cookies.auth_token;
  res.render("poll-res.ejs", { username: req.user.username });
});

app.post("/create-poll", authMiddleware, async (req, res) => {
  const userId = req.user.email; // Assuming `authMiddleware` attaches `user` to `req`
  const { question, options } = req.body;

  // Validate input
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "Invalid input. A question and at least two options are required.",
    });
  }

  try {
    // Start a session for a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    // Create and save the poll
    const newPoll = new Poll({ question, createdBy: userId });
    const savedPoll = await newPoll.save({ session });

    // Create and save the options
    const optionDocs = options.map((name) => ({
      name,
      pollId: savedPoll._id,
    }));

    await Option.insertMany(optionDocs, { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Poll and options created successfully",
      poll: savedPoll,
      options: optionDocs,
    });
  } catch (error) {
    console.error("Error saving poll and options:", error.message);
    res.status(500).json({ error: "Failed to create poll and options" });
  }
});

app.get("/create-poll", authMiddleware, (req, res) => {
  res.render("create-poll");
});

app.post("/poll/option-selected", authMiddleware, async (req, res) => {
  const userId = req.user.email; // Get the user ID from the auth middleware
  const { sid, pid } = req.query; // Extract option ID and poll ID from the query

  console.log("Recieved: ", sid, pid);

  if (!pid || !sid) {
    return res.status(400).json({ message: "Missing Sid or Pid" }); // Validate input
  }

  const session = await mongoose.connection.startSession(); // Start a session for transaction

  try {
    session.startTransaction();

    // Check if the user has already voted for this poll
    const existingVote = await Vote.findOne({ pollId: pid, userId }).session(
      session
    );

    if (existingVote) {
      if (existingVote.optionId === sid) {
        // If the user is trying to vote for the same option, return early
        return res
          .status(400)
          .json({ message: "You have already voted for this option." });
      } else {
        // Update the user's vote to the new option
        existingVote.optionId = sid;
        const updatedVote = await existingVote.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.json({ message: "Vote updated successfully.", updatedVote });
      }
    }

    // If no existing vote, create a new one
    const vote = new Vote({ pollId: pid, optionId: sid, userId });
    const savedVote = await vote.save({ session });

    await session.commitTransaction(); // Commit the transaction
    session.endSession();
    res.json({ message: "Vote submitted successfully.", savedVote });
  } catch (err) {
    await session.abortTransaction(); // Roll back the transaction
    session.endSession();
    console.error("Error while voting:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(port, async () => {
  mongooseConnect(process.env.mongoURI);
  mongoose.connection.on("connected", async () => {
    try {
      const db = mongoose.connection
        .useDb("PollingSystem")
        .getClient()
        .db("PollingSystem");
      const collections = await db.listCollections().toArray();
      if (collections.length == 0) {
        console.log("No collections ");
      }
      const collectionNames = collections.map((col) => col.name);
      console.log("Collections : ", collectionNames);
    } catch (err) {
      console.error("message: ", err);
    }
  });
});
