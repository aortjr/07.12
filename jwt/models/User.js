const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
  },
  email: {
    type: String,
    trim: true, //dhsdb 1541 @naver.com 을 dhsdb1541@naver.com로 trim
    unique: 1,
  },
  password: {
    type: String,
    minLength: 5,
  },
  lastName: {
    type: String,
    maxLength: 50,
  },
  role: {
    type: Number,
    default: 0,
  },
  image: String,
  token: {
    type: String,
  },
  tokenExp: {
    type: Number,
  },
});


userSchema.pre("save", function (next) {
  let user = this;


  if (user.isModified("password")) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function (plainPassword) {

  return bcrypt
    .compare(plainPassword, this.password)
    .then((isMatch) => isMatch)
    .catch((err) => err);
};

userSchema.methods.generateToken = function () {
  const token = jwt.sign(this._id.toHexString(), "secretToken");
  this.token = token;
  return this.save()
    .then((user) => user)
    .catch((err) => err);
};

userSchema.statics.findByToken = function (token) {
  let user = this;
  return jwt.verify(token, "secretToken", function (err, decoded) {
    return user
      .findOne({ _id: decoded, token: token })
      .then((user) => user)
      .catch((err) => err);
  });
};

const User = mongoose.model("User", userSchema);

module.exports = { User };
