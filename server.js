import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import mongoose from 'mongoose'
 
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://avigupta1910:HQFhXznwogLX6zjA@clusterbrahamand.1zkd1vo.mongodb.net/?retryWrites=true&w=majority&appName=Clusterbrahamand"

mongoose.connect(MONGO_URI, {
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.log("MongoDB connection error:", err))
 
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port)
 
  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`
  )
})