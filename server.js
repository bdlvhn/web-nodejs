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

let db;
MongoClient.connect(process.env.DB_URL, (error, client) => {
  if (error) return console.log(error);
  db = client.db("todoapp");
});

app.listen(process.env.PORT, function () {
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

app.use("/shop", require("./routes/shop.js"));
app.use("/board", require("./routes/board.js"));
