var router = require("express").Router();

function isLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인하지 않았습니다.");
  }
}
router.use(isLogin);

router.get("/sub/sports", function (req, res) {
  res.send("스포츠 게시판");
});

router.get("/sub/game", function (req, res) {
  res.send("게임 게시판");
});

module.exports = router;
