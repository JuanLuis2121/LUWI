
import express from "express";
import cors from "cors";
import empresasRoutes from "./routes/empresas.routes.js";
import candidatosRoutes from "./routes/candidatos.routes.js";
import cursosRoutes from "./routes/cursos.routes.js";
import evaluacionesRoutes from "./routes/evaluaciones.routes.js";
import progresoRoutes from "./routes/progreso.routes.js";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import rutasAprendizajeRoutes from "./routes/rutasAprendizaje.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import cookieParser from "cookie-parser";

const app = express();

// Registro de solicitudes HTTP
app.use(morgan("dev"));

// Configuración CORS actualizada
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar cookies
app.use(cookieParser());

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.json({
    message: "API de LUWI funcionando correctamente",
  });
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Rutas de los módulos
app.use("/api/empresas", empresasRoutes);
app.use("/api/candidatos", candidatosRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/evaluaciones", evaluacionesRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/rutas-aprendizaje", rutasAprendizajeRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;
