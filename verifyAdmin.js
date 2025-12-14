import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";

const password = "17260227Alba"; // contraseña en crudo
const hash = process.env.ADMIN_HASHED_PASSWORD; // hash que pusiste en .env

const isValid = bcrypt.compareSync(password, hash);

console.log("Hash válido:", isValid);
