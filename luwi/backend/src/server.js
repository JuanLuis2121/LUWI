import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import candidatosRoutes from "./routes/candidatos.routes.js";
import cursosRoutes from "./routes/cursos.routes.js";
import evaluacionesRoutes from "./routes/evaluaciones.routes.js";
import progresoRoutes from "./routes/progreso.routes.js";
import authRoutes from "./routes/auth.routes.js";
import rutasAprendizajeRoutes from "./routes/rutasAprendizaje.routes.js";
import empresaRoutes from "./routes/empresas.routes.js";
import puestoRoutes from "./routes/puesto.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

// Registro de solicitudes HTTP
app.use(morgan("dev"));

// Configuración CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar cookies
app.use(cookieParser());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.json({
    message: "API de LUWI funcionando correctamente",
  });
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Rutas de los módulos
app.use("/api/empresas", empresaRoutes);
app.use("/api/candidatos", candidatosRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/evaluaciones", evaluacionesRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/rutas-aprendizaje", rutasAprendizajeRoutes);
app.use("/api/puestos", puestoRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;
