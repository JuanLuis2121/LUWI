import dns from 'node:dns'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '1.1.1.1'])

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB conectado correctamente')
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message)
    process.exit(1)
  }
}

export default conectarDB