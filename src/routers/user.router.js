const express = require("express");
const router = express.Router();
const {
  insertUser,
  getUserByEmail,
  getUserById,
} = require("../../model/user/User.model");
const {
  createAccessJWT,
  createRefreshJWT,
} = require("../../helpers/jwt.helper");
const {
  userAuthorization,
} = require("../../middlewares/authorization.middleware");

const bcrypt = require("bcrypt");
const saltRounds = 10;
const {
  hashPassword,
  comparePassword,
} = require("../../helpers/bcrypt.helper");
const { json } = require("body-parser");

router.all("/", (req, res, next) => {
  // res.json({
  //   message: "this message is from user router",
  // });
  next();
});

// Get user profile router
router.get("/", userAuthorization, async (req, res) => {
  const _id = req.userId;
  const userProfile = await getUserById(_id);

  res.json({ user: userProfile });
});
// Create new user route
router.post("/", async (req, res, next) => {
  const { name, company, address, phone, email, password } = req.body;
  try {
    // HASH PASSWORD
    const hashedPassword = await hashPassword(password);

    const newUserObj = {
      name,
      company,
      address,
      phone,
      email,
      password: hashedPassword,
    };
    const result = await insertUser(newUserObj);
    console.log(result);
    res.json({
      message: "New user created",
      result,
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "error",
      message: error.message,
    });
  }
});

// User SIGN IN route
router.post("/login", async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;
  // console.log(email, password);

  if (!email || !password)
    return res.json({
      status: "failed",
      message: "Invalid form submit",
    });

  // GET USER WITH EMAIL FROM DB
  const user = await getUserByEmail(email);
  // console.log(user);
  const passFromDb = user && user._id ? user.password : null;
  // console.log(passFromDb);
  if (!passFromDb)
    return res.json({
      status: "error",
      message: "Invalid email or password",
    });
  const result = await comparePassword(password, passFromDb);

  // console.log(result);
  if (!result)
    return res.json({
      status: "failed",
      message: "Invalid email or password",
    });

  const accessJWT = await createAccessJWT(user.email, `${user._id}`);
  const refreshJWT = await createRefreshJWT(user.email, `${user._id}`);

  res.json({
    status: "success",
    message: "Login Successfully",
    accessJWT,
    refreshJWT,
  });
});

module.exports = router;
