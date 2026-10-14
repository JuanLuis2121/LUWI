import express from "express";
import cors from "cors";
import empresasRoutes from "./routes/empresas.routes.js";
import candidatosRoutes from "./routes/candidatos.routes.js";
import cursosRoutes from "./routes/cursos.routes.js"; // NUEVO
import evaluacionesRoutes from "./routes/evaluaciones.routes.js"; // NUEVO
import progresoRoutes from "./routes/progreso.routes.js"; // NUEVO

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API de LUWI funcionando correctamente",
  });
});

app.use("/api/empresas", empresasRoutes);
app.use("/api/candidatos", candidatosRoutes);
app.use("/api/cursos", cursosRoutes); // NUEVO
app.use("/api/evaluaciones", evaluacionesRoutes); // NUEVO
app.use("/api/progreso", progresoRoutes); // NUEVO

export default app;
