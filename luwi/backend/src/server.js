import express from "express";
import cors from "cors";
import empresasRoutes from "./routes/empresas.routes.js";
import candidatosRoutes from "./routes/candidatos.routes.js";
import cursosRoutes from "./routes/cursos.routes.js"; // NUEVO
import evaluacionesRoutes from "./routes/evaluaciones.routes.js"; // NUEVO
import progresoRoutes from "./routes/progreso.routes.js"; // NUEVO
import morgan from "morgan"; // NUEVO
import authRoutes from "./routes/auth.routes.js"; // NUEVO
import cookieParser from "cookie-parser"; // NUEVO

const app = express();

app.use(morgan("dev")); // NUEVO
app.use(
  cors({
    origin: "http://localhost:5173", //  URL del frontend
    credentials: true, // Permite enviar cookies
  }),
);
app.use(express.json());
app.use(cookieParser()); //NUEVO

app.get("/", (req, res) => {
  res.json({
    message: "API de LUWI funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes); // NUEVO
app.use("/api/empresas", empresasRoutes);
app.use("/api/candidatos", candidatosRoutes);
app.use("/api/cursos", cursosRoutes); // NUEVO
app.use("/api/evaluaciones", evaluacionesRoutes); // NUEVO
app.use("/api/progreso", progresoRoutes); // NUEVO

export default app;
