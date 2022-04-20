// configuration
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use("/public", express.static("public"));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
app.use(
  session({ secret: "secretcode", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());
require("dotenv").config();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

let multer = require("multer");
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/image");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });
const { ObjectId } = require("mongodb");

//
let db;
MongoClient.connect(process.env.DB_URL, (error, client) => {
  if (error) return console.log(error);
  db = client.db("todoapp");
});

http.listen(process.env.PORT, function () {
  console.log("listening on 8080");
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.get("/pet", function (req, res) {
  res.send("펫 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/beauty", function (req, res) {
  res.send("뷰티 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray((error, result) => {
      res.render("list.ejs", { posts: result });
    });
});

app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (error, result) => {
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (error, result) => {
      res.render("edit.ejs", { data: result });
    }
  );
});

app.put("/edit", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (error, result) => {
      res.redirect("/list");
    }
  );
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/mypage", isLogin, (req, res) => {
  res.render("mypage.ejs", { user: req.user });
});

function isLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인하지 않았습니다.");
  }
}

app.get("/search", (req, res) => {
  db.collection("post")
    .find({ title: /req.query.value/ })
    .toArray((error, result) => {
      res.render("result.ejs", { posts: result });
    });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    (id, password, done) => {
      db.collection("login").findOne({ id }, function (error, result) {
        if (error) return done(error);

        if (!result)
          return done(null, false, {
            message: "존재하지 않는 아이디입니다.",
          });
        if (password == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "비밀번호를 틀렸습니다." });
        }
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.collection("login").findOne({ id }, (error, result) => {
    done(null, result);
  });
});

app.post("/register", (req, res) => {
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    (error, result) => {
      res.redirect("/");
    }
  );
});

app.post("/add", (req, res) => {
  res.send("전송 완료");
  db.collection("counter").findOne({ name: "게시물갯수" }, (error, result) => {
    let totalPost = result.totalPost;
    let info = {
      _id: totalPost + 1,
      userId: req.user._id,
      date: req.body.date,
      title: req.body.title,
    };

    db.collection("post").insertOne(info, (error, res) => {
      console.log("저장 완료");
      db.collection("counter").updateOne(
        { name: "게시물갯수" },
        { $inc: { totalPost: 1 } },
        (error, result) => {
          if (error) return console.log(error);
        }
      );
    });
  });
});

app.delete("/delete", (req, res) => {
  var deleteData = { _id: parseInt(req.body._id), userId: req.user._id };

  db.collection("post").deleteOne(deleteData, (error, result) => {
    res.status(200).send({ message: "done" });
    res.render("list.ejs", { posts: result });
  });
});

app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

app.post("/upload", upload.single("profile"), (req, res) => {
  res.send("upload complete");
});

app.get("/image/:imageName", (req, res) => {
  res.sendFile(__dirname + "/public/image/" + req.params.imageName);
});

app.post("/chatroom", isLogin, (req, res) => {
  var save = {
    title: "chatroom",
    member: [ObjectId(req.body.chatee), req.user._id],
    date: new Date(),
  };

  db.collection("chatroom")
    .insertOne(save)
    .then((result) => {
      res.send("success");
    });
});

app.get("/chat", isLogin, (req, res) => {
  db.collection("chatroom")
    .find({ member: req.user._id })
    .toArray()
    .then((result) => {
      res.render("chat.ejs", { data: result });
    });
});

app.post("/message", isLogin, (req, res) => {
  const toSend = {
    parent: req.body.parent,
    content: req.body.content,
    userId: req.user._id,
    date: new Date(),
  };
  db.collection("message")
    .insertOne(toSend)
    .then(() => {
      console.log("db save success");
      res.send("db save success");
    });
});

app.get("/message/:id", isLogin, (req, res) => {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection("message")
    .find({ parent: req.params.id })
    .toArray()
    .then((result) => {
      res.write("event: test\n");
      res.write(`data : ${JSON.stringify(result)}\n\n`);
    });

  const pipeline = [{ $match: { "fullDocument.parent": req.params.id } }];
  const changeStream = db.collection("message").watch(pipeline);

  changeStream.on("change", (result) => {
    res.write("event: test\n");
    res.write(`data : ${JSON.stringify([result.fullDocument])}\n\n`);
  });
});

app.get("/socket", (req, res) => {
  res.render("socket.ejs");
});

app.use("/shop", require("./routes/shop.js"));
app.use("/board", require("./routes/board.js"));

io.on("connection", function (socket) {
  console.log("user login");

  socket.on("joinroom", function (data) {
    socket.join("room1");
  });

  socket.on("room1-send", function (data) {
    io.to("room1").emit("broadcast", data);
  });

  socket.on("user-send", function (data) {
    io.emit("broadcast", data);
  });
});
