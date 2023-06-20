import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://zaid5775.github.io/cipherscape", // Replace with your React app's URL
  credentials: true
}));

mongoose.connect(process.env.MY_APP_URL);
console.log("DB connected");

const PlayersSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
});

const PlayersModel = new mongoose.model("players", PlayersSchema);

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.session_token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, "my_secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
};

app.post("/Login", (req, res) => {
  const { username, password } = req.body;
  PlayersModel.findOne({ username: username })
    .then((user) => {
      if (user) {
        if (user.password === password) {
          const token = jwt.sign({ username: user.username }, "my_secret_key");
          res.cookie("session_token", token, { httpOnly: true });
          res.json({ success: true, username: user.username });
        } else {
          res.json({ success: false, message: "Incorrect Password!" });
        }
      } else {
        res.json({ success: false, message: "Invalid Username!" });
      }
    });
});

app.get("/cipherscape", verifyToken, (req, res) => {
  return res.json({ success: true, username: req.user.username });
});

app.post("/Signup", (req, res) => {
  const { username, password, email } = req.body;
  PlayersModel.findOne({ username: username })
    .then((existingUser) => {
      if (existingUser) {
        res.status(409).json({ message: "Username already exists" });
      } else {
        PlayersModel.create({ username, password, email })
          .then((newUser) => res.json(newUser))
          .catch((err) => res.json(err));
      }
    })
    .catch((err) => res.json(err));
});

// Serve the static files for your React app
app.use(express.static(path.join(__dirname, "../cipher/build")));

// For any other route, serve the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../cipher/build/index.html"));
});


const PORT = process.env.PORT
// Start the server
app.listen(PORT, () => {
  console.log("Server is running on port 9002");
});
