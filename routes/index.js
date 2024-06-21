var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.get("/profile", async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  // console.log(user);
  res.render("profile", { user });
});

router.get("/feed", async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");
  res.render("feed", { user, posts });
});

router.get("/add", async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("add", { user });
});

router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("profile");
  }
);

router.get("/signup", function (req, res, next) {
  res.render("signup");
});

router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    if (!req.file) {
      return res.status(400).send("no file were uploaded");
    }
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

// Register
router.post("/register", function (req, res) {
  var userdata = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  });
  userModel.register(userdata, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

// LogIn
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    // failureFlash: true,
  }),
  function (req, res) {}
);

// LogOut
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// isLoggedin\
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;
