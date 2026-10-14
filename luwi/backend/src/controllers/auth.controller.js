import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { CreateAccessToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    //Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    //Creacion de usuario
    const newUser = new User({
      username,
      email,
      password: passwordHash,
    });

    // Guardar usuario en la base de datos
    const UserSaved = await newUser.save();

    // Crear token de acceso
    const token = await CreateAccessToken({ id: UserSaved._id });
    res.cookie("token", token);
    res.json({
      id: UserSaved._id,
      username: UserSaved.username,
      email: UserSaved.email,
      createdAt: UserSaved.createdAt,
      updatedAt: UserSaved.updatedAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "El correo electrónico ya está registrado",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const UserFound = await User.findOne({ email });
    if (!UserFound)
      return res.status(400).json({ message: "Email incorrecto" });

    const IsMatch = await bcrypt.compare(password, UserFound.password);
    if (!IsMatch)
      return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = await CreateAccessToken({ id: UserFound._id });
    res.cookie("token", token);
    res.json({
      id: UserFound._id,
      username: UserFound.username,
      email: UserFound.email,
      createdAt: UserFound.createdAt,
      updatedAt: UserFound.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
