import app from "./server.js";
import conectarDB from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();

conectarDB();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor LUWI ejecutándose en puerto ${PORT}`);
});
