import Competencia from "../models/Competencia.js";

// CONSULTAR EL CATALOGO DE COMPETENCIAS (solo las activas)
export const getCompetencias = async (req, res) => {
  try {
    const { categoria } = req.query;

    const filtro = { estado: "ACTIVA" };

    // Filtro opcional: /api/competencias?categoria=BLANDA
    if (categoria) {
      filtro.categoria = String(categoria).toUpperCase();
    }

    const competencias = await Competencia.find(filtro)
      .select("nombre descripcion categoria")
      .sort({ categoria: 1, nombre: 1 })
      .collation({ locale: "es" })
      .lean();

    res.status(200).json(competencias);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar las competencias",
      error: error.message,
    });
  }
};