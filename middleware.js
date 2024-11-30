import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
// Middleware
const auth_sup_key = process.env.Auth_Super_SecretKey;
function authMiddleware(req, res, next) {
  console.log(auth_sup_key);
  const token = req.cookies["auth_token"]; // Get token from cookies
  console.log("Token: ", token);
  if (!token) {
    return res.render("loginForm");
  }

  try {
    const decoded = jwt.verify(token, auth_sup_key); // Verify token
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).send({ message: "Invalid or expired token" });
  }
}
export default authMiddleware;
