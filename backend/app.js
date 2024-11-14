const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const categoryRoutes = require("./routes/category.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes");
const notificationRoutes = require("./routes/notification.routes");
const passport = require("./config/passport");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);

initSocket(server);

const io = require("./socket").getSocket();
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3000;

app.use("./uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notify", notificationRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is listening on port ${PORT}`);
});
