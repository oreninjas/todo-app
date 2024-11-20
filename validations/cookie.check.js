const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const userModel = require("../model/user.model");

const cookieChecker = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const data = jwt.verify(token, process.env.PRIVATE_KEY);
    const user = await userModel
      .findOne({ email: data.email })
      .select("-password");
    req.user = user.email;

    next();
  } else {
    // if there's no token then it'll redirect;
    res.redirect("/login");
  }
};

module.exports = cookieChecker;
