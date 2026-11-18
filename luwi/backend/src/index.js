import dotenv from "dotenv";
import app from "./server.js";
import conectarDB from "./config/db.js";
dotenv.config();

console.log("EMAIL_USER:", Boolean(process.env.EMAIL_USER));
console.log("EMAIL_APP_PASSWORD:", Boolean(process.env.EMAIL_APP_PASSWORD));
conectarDB();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor LUWI ejecutándose en puerto ${PORT}`);
});
