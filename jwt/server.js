const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { User } = require("./models/User");
const { auth } = require("./middleware/auth");
const cors = require("cors");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const dbAddress =
  "mongodb+srv://aortjr:<password>@cluster0.jy7il.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose
  .connect(dbAddress, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => res.send("Hello world!!!!"));

app.get("/api/hello", (req, res) => {
  res.send("안녕하세요");
});

app.post("/api/user/register", (req, res) => {

  const user = new User(req.body);
  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({ success: true });
  });
});

app.post("/api/user/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err || !user) {
      return res.json({
        loginSuccess: false,
        message: "존재하지 않는 아이디입니다.",
      });
    }
    user
      .comparePassword(req.body.password)
      .then((isMatch) => {
        if (!isMatch) {
          return res.json({
            loginSuccess: false,
            message: "비밀번호가 일치하지 않습니다",
          });
        }
        user
          .generateToken()
          .then((user) => {
            res.cookie("x_auth", user.token).status(200).json({
              loginSuccess: true,
              userId: user._id,
            });
          })
          .catch((err) => {
            res.status(400).send(err);
          });
      })
      .catch((err) => res.json({ loginSuccess: false, err }));
  });
});

app.get("/api/user/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req._id,
    isAdmin: req.user.role === 09 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

app.post("/api/user/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    res.clearCookie("x_auth");
    return res.status(200).send({
      success: true,
    });
  });
});

const port = 9000;

app.listen(port, () => console.log(`listening on port ${port}`));
