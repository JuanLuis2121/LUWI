import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import empresasRoutes from './src/routes/empresas.routes.js'
import candidatosRoutes from './src/routes/candidatos.routes.js'
import cursosRoutes from './src/routes/cursos.routes.js' // NUEVO
import evaluacionesRoutes from './src/routes/evaluaciones.routes.js' // NUEVO
import progresoRoutes from './src/routes/progreso.routes.js' // NUEVO

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'API de LUWI funcionando correctamente'
  })
})

app.use('/api/empresas', empresasRoutes)
app.use('/api/candidatos', candidatosRoutes)
app.use('/api/cursos', cursosRoutes) // NUEVO
app.use('/api/evaluaciones', evaluacionesRoutes) // NUEVO
app.use('/api/progreso', progresoRoutes) // NUEVO

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Servidor LUWI ejecutándose en puerto ${PORT}`)
})