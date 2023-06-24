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
  origin: ["http://localhost:3000"],
  methods :  ["GET, POST"],
  credentials: true
}));

//"https://cipherscape.onrender.com

const sessionStore = MongoStore.create({
  mongoUrl: "mongodb+srv://szaid5775:7208724253@cluster.epkwhq7.mongodb.net/Players",
  collectionName: "sessions",
  ttl: 60 * 60 * 24, // session TTL (optional)
});


// localhost

// const sessionStore = MongoStore.create({
//   mongoUrl: "mongodb+srv://szaid5775:7208724253@cluster.epkwhq7.mongodb.net/Players",
//   collectionName: "sessions",
//   ttl: 60 * 60 * 24, // session TTL (optional)
// });

app.use(session({
  secret : "areyougay",
  resave : false,
  saveUninitialized : false,
  cookie : {
    secure :  false,
    maxAge : 10000 * 60 * 60 * 24
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
          // console.log("[0]" , user[0].username)
          // console.log("norm",user.username)
          console.log("session",req.session.username)
          res.json({ success: true, username: req.session.username });
        } else {
          res.json({ success: false, message: "Incorrect Password!" });
        }
      } else {
        res.json({ success: false, message: "Invalid Username!" });
      }
    });
});

// GetUser



app.post("/Signup", (req, res) => {
  const { username, password, email } = req.body;
  PlayersModel.findOne({ username: username })
    .then((existingUser) => {
      if (existingUser) {
        res.status(409).json({ message: "Username already exists" });
      } else {
        PlayersModel.create({ username, password, email })
          .then((newUser) => {
          
            res.json(newUser);
          })
          .catch((err) => res.json(err));
      }
    })
    .catch((err) => res.json(err));
});





app.get('/', (req, res) => {
  const { username } = req.session;
  
  PlayersModel.findOne({ username })
    .then((user) => {
      if (user) {
        res.json({ success: true, email: user.email, username });
      } else {
        res.json({ success: false, message: 'User not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Error fetching user' });
    });
});







app.post('/ChangePassword', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  PlayersModel.findOne({ username })
    .then((user) => {
      if (user) {
        if (user.password === oldPassword) {
          user.password = newPassword;
          user.save()
            .then(() => {
              res.json({ success: true, message: 'Password changed successfully' });
            })
            .catch((err) => {
              res.status(500).json({ success: false, message: 'Error saving user' });
            });
        } else {
          res.json({ success: false, message: 'Incorrect old password' });
        }
      } else {
        res.json({ success: false, message: 'User not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Error fetching user' });
    });
});






app.listen(9002, () => {
  console.log("Server is running on port 9002");
});