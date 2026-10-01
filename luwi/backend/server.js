import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'API de LUWI funcionando correctamente'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Servidor LUWI ejecutándose en puerto ${PORT}`)
})