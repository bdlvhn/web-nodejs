const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use("/public", express.static("public"));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

let db;
MongoClient.connect(
  "mongodb+srv://admin:tmxkqjrtm4500!@cluster0.2c5cw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  (error, client) => {
    if (error) return console.log(error);
    db = client.db("todoapp");
  }
);

app.listen(8080, function () {
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

app.post("/add", (req, res) => {
  console.log(req.body);
  res.send("전송 완료");
  db.collection("counter").findOne({ name: "게시물갯수" }, (error, result) => {
    let totalPost = result.totalPost;
    db.collection("post").insertOne(
      { _id: totalPost + 1, date: req.body.date, title: req.body.title },
      (error, res) => {
        console.log("저장 완료");
        db.collection("counter").updateOne(
          { name: "게시물갯수" },
          { $inc: { totalPost: 1 } },
          (error, result) => {
            if (error) return console.log(error);
          }
        );
      }
    );
  });
});

app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray((error, result) => {
      res.render("list.ejs", { posts: result });
    });
});

app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, (error, result) => {
    res.status(200).send({ message: "done" });
    res.render("list.ejs");
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
