const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const dbConnection = require("./config/db.connection");
dbConnection();
const app = express();

const userModel = require("./model/user.model");
const todoModel = require("./model/todo.model");
const cookieChecker = require("./validations/cookie.check");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const flash = require("connect-flash");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/create/user", async (req, res) => {
  const { username, email, password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let newUser = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  let token = jwt.sign({ email: newUser.email }, process.env.PRIVATE_KEY);
  res.cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
  const msg = req.flash("msg");
  res.render("login", { msg });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const findLoginData = await userModel.findOne({ email: email });

  if (!findLoginData) {
    let msg = req.flash("msg")[0] || "Welcome back!";
    return res.redirect("/login", { msg });
  }

  const comparePassword = await bcrypt.compare(
    password,
    findLoginData.password
  );

  if (comparePassword) {
    let token = jwt.sign({ email: email }, process.env.PRIVATE_KEY);
    res.cookie("token", token, {
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/dashboard");
  } else {
    req.flash("msg", "Something went wrong!");
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/dashboard", cookieChecker, async (req, res) => {
  const userEmail = req.user;
  const user = await userModel
    .findOne({ email: userEmail })
    .select("-password");

  let userName = user.username;

  res.render("dashboard", { userName });
});

app.post("/create/todo", cookieChecker, async (req, res) => {
  const { title, description, encrypt, encryPass } = req.body;
  const userEmail = req.user;

  const isEncrypt = encrypt === "on" || encrypt === true;

  const userData = await userModel.findOne({ email: userEmail });

  if (encrypt === "on") {
    let saltRounds = await bcrypt.genSalt(10);
    let hashedEncryPassword = await bcrypt.hash(encryPass, saltRounds);

    const newTodo = await todoModel.create({
      title,
      description,
      user: userData._id,
      encrypted: isEncrypt,
      encryPass: hashedEncryPassword,
    });
    userData.todo.push(newTodo._id);
    userData.save();
  } else {
    const newTodo = await todoModel.create({
      title,
      description,
      user: userData._id,
    });
    userData.todo.push(newTodo._id);
    userData.save();
  }

  res.redirect("/dashboard/todos");
});

app.get("/dashboard/todos", cookieChecker, async (req, res) => {
  const userEmail = req.user;
  const user = await userModel.findOne({ email: userEmail });

  // const userTodos = user.todo || [];

  const todos = await todoModel.find({ user: user._id });

  res.render("todos", { todos: todos });
});

app.get("/dashboard/todos/edit/:id", cookieChecker, async (req, res) => {
  let params = req.params.id;
  let userEmail = req.user;
  const user = await userModel.findOne({ email: userEmail });
  const todo = await todoModel.findOne({ _id: params, user: user._id });

  res.render("editTodo", { todo });
});

app.post("/dashboard/todos/edit/:id", cookieChecker, async (req, res) => {
  let param = req.params.id;
  let userEmail = req.user;
  let user = await userModel.findOne({ email: userEmail });
  const { title, description } = req.body;
  await todoModel.findOneAndUpdate(
    { _id: param, user: user._id },
    { title, description },
    { new: true }
  );

  res.redirect("/dashboard/todos");
});

app.get("/dashboard/todos/delete/:id", cookieChecker, async (req, res) => {
  let params = req.params.id;
  let userEmail = req.user;

  const user = await userModel.findOne({ email: userEmail });
  if (!user) {
    return res.redirect("/");
  }

  const deleteTodo = await todoModel.findOneAndDelete({
    _id: params,
    user: user._id,
  });

  await userModel.updateOne({ _id: user._id }, { $pull: { todo: params } });

  res.redirect("/dashboard/todos");
});

app.listen(3000);
