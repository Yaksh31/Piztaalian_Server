const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const { throws } = require("assert");
require("dotenv").config();
const axios = require("axios");
const eventEmitter = require("./eventEmitter");
const jwt = require("jsonwebtoken");

const client = require("prom-client"); // metric collection
const responseTime = require("response-time");

const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const { log } = require("console");

// Collect default metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
  name: "http_express_req_res_time",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 300, 400, 500, 800, 1000, 2000],
});

const totalReqCounter = new client.Counter({
  name: "total_req",
  help: "Total Number of  requests",
});

const options = {
  transports: [
    new LokiTransport({
      labels: { appName: "piztaalian" },
      host: "http://127.0.0.1:3100",
    }),
  ],
};
const logger = createLogger(options);

global.__basedir = __dirname;
const allowedOrigin1 = process.env.REACT_APP_API_URL;
const allowedOrigin2 = process.env.REACT_APP_API_URL_BRANCH;

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: [allowedOrigin1, allowedOrigin2],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Logging connection events for better traceability
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

io.on("error", (err) => {
  logger.error("Socket.IO error event:", err);
});

// io.use((socket, next) => {
//   const token = socket.handshake.query.token;
//   if (!token) {
//     return next(new Error("Authentication error: Token missing"));
//   }
//   jwt.verify(token, process.env.ADMIN_JWT_SECRET_TOKEN, (err, decoded) => {
//     if (err) {
//       return next(new Error("Authentication error: Invalid token"));
//     }
//     socket.decoded = decoded;
//     next();
//   });
// });

// Subscribe to eventEmitter events from controllers and broadcast them to clients
eventEmitter.on("newOrder", (order) => {
  io.emit("orderCreated", order);
});

eventEmitter.on("orderUpdated", (order) => {
  io.emit("orderUpdated", order);
});

eventEmitter.on("orderDeleted", (order) => {
  io.emit("orderDeleted", order);
});

eventEmitter.on("ordersListByParamsFetched", (data) => {
  io.emit("ordersListByParamsFetched", data);
});

eventEmitter.on("ordersByBranchFetched", (data) => {
  io.emit("ordersByBranchFetched", data);
});

eventEmitter.on("orderStatusUpdated", (order) => {
  io.emit("orderStatusUpdated", order);
});

eventEmitter.on("ordersUpdateTrigger", () => {
  io.emit("ordersUpdateTrigger");
});

// io.use((socket, next) => {
//   const token = socket.handshake.query.token;
//   if (!token) {
//     return next(new Error("Authentication error: Token missing"));
//   }

//   jwt.verify(token, process.env.ADMIN_JWT_SECRET_TOKEN, (err, decoded) => {
//     if (err) {
//       return next(new Error("Authentication error: Invalid token"));
//     }
//     socket.decoded = decoded;
//     next();
//   });
// });

let databasestatus = "In-Progress";
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Adjust the '*' to your frontend's origin if possible
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.options("*", cors());
app.use("/uploads", express.static("uploads"));
app.use("/log", express.static("log"));
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.DATABASE, { useNewUrlParser: true })
  .then(() => {
    databasestatus = "DB connected";
    logger.info("DB connected");
  })
  .catch((err) => {
    databasestatus = err;
    logger.error("DB Error => ", err);
  });

// autoIncrement.initialize(mongoose.connection);

//middlewares
app.use(morgan("dev"));
// app.use(
//   morgan("combined", {
//     stream: { write: (msg) => logger.info(msg.trim()) },
//   })
// );

app.use(
  responseTime((req, res, time) => {
    totalReqCounter.inc();
    reqResTime
      .labels({
        method: req.method,
        route: req.url,
        status_code: res.statusCode,
      })
      .observe(time);
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("files"));
// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//routes
// app.use("/api", authRoutes);
fs.readdirSync("./routes").map((r) =>
  app.use("/api", require("./routes/" + r))
);

// app.use("/api", require("./routes/ToDoTask"));

app.get("/api", (req, res) => {
  res.json({
    version: "v1.0-24.01.2024.",
    dbstatus: databasestatus,
  });
});

app.get("/error", (req, res) => {
  res.test("hit the api button. v-24.01.2024.");
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
});

app.use(async (err, req, res, next) => {
  let filedata = {
    datetime: new Date(),
    message: err?.message,
    stake: err?.stack,
  };
  try {
    let writecontent = [];
    if (fs.existsSync("log/error.html")) {
      let filedata = fs.readFileSync("log/error.html");
      if (filedata) {
        writecontent = JSON.parse(filedata);
      }
    }
    writecontent.push(filedata);
    fs.writeFileSync(
      "log/error.html",
      JSON.stringify(writecontent),
      function (err) {
        if (err) throw err;
        logger.info("Saved!");
      }
    );
  } catch (error) {}

  return res.status(500).json({
    success: false,
    msg: "We are updating",
    data: filedata,
  });
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  logger.info(`Server and Socket.IO are running on port ${port}`);
});
