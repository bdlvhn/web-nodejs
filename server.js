const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

let db;
const MongoClient = require("mongodb").MongoClient;
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
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
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
    console.log("delete complete");
    res.status(200).send({ message: "done" });
  });
});
