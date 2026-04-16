import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Middleware
app.use('/*', cors())

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Algorium UK API - Online',
    version: '1.0.0',
    status: 'Ready for Digital Revolution'
  })
})

// Example "Project" API for the Portfolio
app.get('/api/projects', (c) => {
  return c.json([
    { id: 1, title: 'AI Marketing Dashboard', category: 'AI Marketing' },
    { id: 2, title: 'Luxury E-commerce', category: 'Web Development' },
    { id: 3, title: 'Smart City Mobile App', category: 'Mobile Apps' }
  ])
})

// Contact Form Endpoint
app.post('/api/contact', async (c) => {
  const body = await c.req.json()
  console.log('📬 New Enquiry Received:', body)
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return c.json({
    success: true,
    message: 'Your enquiry has been received. Our team will contact you shortly.',
    receivedData: body
  })
})

const port = 3001
console.log(`🚀 Next-Gen Backend running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
