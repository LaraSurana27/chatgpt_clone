const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUSer(req, res) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !fullName.firstName || !fullName.lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { firstName, lastName } = fullName;

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const isUserAlreadyExists = await userModel.findOne({ email });

    if (isUserAlreadyExists) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      fullName: { firstName, lastName },
      email,
      password: hashPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        email: user.email,
        _id: user._id,
        fullName: user.fullName,
      },
    });

  } catch (error) {
    console.error("Register error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal Server Error during registration" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(409).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(409).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        email: user.email,
        _id: user._id,
        fullName: user.fullName,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error during login" });
  }
}

module.exports = {
  registerUSer,
  loginUser,
};
