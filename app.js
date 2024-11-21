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
  const { title, description } = req.body;
  const userEmail = req.user;

  const userData = await userModel.findOne({ email: userEmail });

  const newTodo = await todoModel.create({
    title,
    description,
    user: userData._id,
  });

  userData.todo.push(newTodo._id);
  userData.save();

  res.redirect("/dashboard/todos");
});

app.get("/dashboard/todos", cookieChecker, async (req, res) => {
  const userEmail = req.user;
  const user = await userModel.findOne({ email: userEmail });

  const userTodos = user.todo || [];

  const todos = await todoModel.find({ user: user._id })
  
  res.render("todos", { todos: todos });
});

app.get('/dashboard/todos/edit/:id', (req, res)=>{
  let params = req.params.id;

  res.render('editTodo')
})

app.listen(3000);
