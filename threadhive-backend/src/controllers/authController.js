import { register, login } from "../services/authService.js";

export const registerUser = async (req, res, next) => {
  const user = await register(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
};

export const loginUser = async (req, res, next) => {
  const data = await login(req.body);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data,
  });
};