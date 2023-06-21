import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import MongoStore from "connect-mongo";


import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:3000", "https://cipherscape.onrender.com"],
  methods :  ["GET, POST"],
  credentials: true
}));

const sessionStore = MongoStore.create({
  mongoUrl: "mongodb+srv://szaid5775:7208724253@cluster.epkwhq7.mongodb.net/Players",
  collectionName: "sessions",
  ttl: 60 * 60 * 24, // session TTL (optional)
});


app.use(session({
  secret : "areyougay",
  resave : false,
  saveUninitialized : false,
  cookie : {
    secure :  false,
    maxAge : 1000 * 60 * 60 * 24
  },
  store: sessionStore,
}))
console.log("connecting db...")

mongoose.connect("mongodb+srv://szaid5775:7208724253@cluster.epkwhq7.mongodb.net/Players", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "Players"
  
});

console.log("DB connected");

const PlayersSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
});

const PlayersModel = new mongoose.model("players", PlayersSchema);



app.post("/Login", (req, res) => {
  const { username, password } = req.body;
  PlayersModel.findOne({ username: username })
    .then((user) => {
      if (user) {
        if (user.password === password) {
          req.session.username = user.username;
         
          console.log(user.username)
          console.log(req.session.username)
          res.json({ success: true, username: req.session.username });
        } else {
          res.json({ success: false, message: "Incorrect Password!" });
        }
      } else {
        res.json({ success: false, message: "Invalid Username!" });
      }
    });
});




app.get("/", (req, res) => {
  if (req.session.username) {
    return res.json({ success: true, username: req.session.username });
  } else if (req.sessionID) {
    // If session ID exists, fetch session data from the store
    sessionStore.get(req.sessionID, (err, session) => {
      if (session && session.username) {
        req.session.username = session.username;
        return res.json({ success: true, username: req.session.username });
      } else {
        return res.json({ success: false });
      }
    });
  } else {
    return res.json({ success: false });
  }
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

app.listen(9002, () => {
  console.log("Server is running on port 9002");
});