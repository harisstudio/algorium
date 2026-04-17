import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Middleware
app.use('/*', cors())

// Mock DB - Real systems would use a database like PostgreSQL/MongoDB
let PORTAL_DATA = {
  clients: [
    {
      id: 'algorium_uk',
      company: 'Algorium UK',
      password: 'pass',
      status: 'Ready',
      projectInfo: {
        name: 'Brand Identity & Web Dashboard',
        progress: 75,
        deadline: '24 Jul 2026',
        roadmap: [
          { phase: 'Discovery & UX', status: 'completed' },
          { phase: 'Brand Identity', status: 'completed' },
          { phase: 'Web Development', status: 'current' },
          { phase: 'Launch', status: 'pending' },
        ]
      },
      files: [
        { name: 'Official Logo v2.png', size: '2.4 MB', type: 'Image' },
        { name: 'Brand Guidelines.pdf', size: '12 MB', type: 'PDF' },
        { name: 'UI Mockups Dashboard.fig', size: '45 MB', type: 'Design' },
      ],
      invoices: [
        { id: 'INV-001', amount: '£2,500', status: 'Paid', date: 'Jul 10, 2026' },
      ],
      activityLog: [
        { id: 1, action: 'Project Synchronized', date: '2026-04-16 14:00', icon: 'sync' },
        { id: 2, action: 'Initial Brand Strategy shared', date: '2026-04-15 09:30', icon: 'file' },
      ],
      messages: [
        { id: 1, sender: 'Algorium Team', text: 'Welcome to your project portal! Initial design mockups are now available in the Drive.', date: '2026-04-16 09:00' }
      ]
    }
  ],
  admin: {
    email: 'admin@algorium.uk',
    password: 'admin'
  }
}

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Algorium UK Portal API - Live',
    version: '1.4.0',
    roles: ['admin', 'client']
  })
})

// Portal Login
app.post('/api/portal/login', async (c) => {
  const { company, password } = await c.req.json()
  
  // Admin Login Check
  if (company === PORTAL_DATA.admin.email && password === PORTAL_DATA.admin.password) {
    return c.json({ success: true, role: 'admin', user: { name: 'Super Admin' } })
  }

  // Client Login Check
  const client = PORTAL_DATA.clients.find(cl => cl.company === company && cl.password === password)
  if (client) {
    return c.json({ success: true, role: 'client', client })
  }

  return c.json({ success: false, message: 'Invalid credentials' }, 401)
})

// Fetch Portal Data (Role-based)
app.get('/api/portal/data', (c) => {
  const role = c.req.query('role')
  const clientId = c.req.query('clientId')

  if (role === 'admin') {
    return c.json({ clients: PORTAL_DATA.clients })
  }

  if (role === 'client' && clientId) {
    const client = PORTAL_DATA.clients.find(cl => cl.id === clientId)
    return c.json({ client })
  }

  return c.json({ success: false, message: 'Unauthorized' }, 403)
})

// Admin Action: Add File or Invoice
app.post('/api/portal/admin/action', async (c) => {
  const { clientId, type, data } = await c.req.json()
  const clientIndex = PORTAL_DATA.clients.findIndex(cl => cl.id === clientId)

  if (clientIndex === -1) return c.json({ success: false, message: 'Client not found' }, 404)

  if (type === 'file') {
    PORTAL_DATA.clients[clientIndex].files.push(data)
    PORTAL_DATA.clients[clientIndex].activityLog.unshift({
      id: Date.now(),
      action: `New file shared: ${data.name}`,
      date: new Date().toLocaleString(),
      icon: 'file'
    })
  } else if (type === 'invoice') {
    PORTAL_DATA.clients[clientIndex].invoices.push(data)
    PORTAL_DATA.clients[clientIndex].activityLog.unshift({
      id: Date.now(),
      action: `New invoice generated: ${data.id}`,
      date: new Date().toLocaleString(),
      icon: 'finance'
    })
  } else if (type === 'status') {
    PORTAL_DATA.clients[clientIndex].projectInfo.progress = data.progress
    PORTAL_DATA.clients[clientIndex].activityLog.unshift({
      id: Date.now(),
      action: `Project progress updated to ${data.progress}%`,
      date: new Date().toLocaleString(),
      icon: 'sync'
    })
  }

  return c.json({ success: true, updatedClient: PORTAL_DATA.clients[clientIndex] })
})

// Communication: Send Message
app.post('/api/portal/message', async (c) => {
  const { clientId, sender, text } = await c.req.json()
  const clientIndex = PORTAL_DATA.clients.findIndex(cl => cl.id === clientId)
  
  if (clientIndex === -1) return c.json({ success: false, message: 'Client not found' }, 404)

  const newMessage = {
    id: Date.now(),
    sender,
    text,
    date: new Date().toLocaleString()
  }

  PORTAL_DATA.clients[clientIndex].messages.push(newMessage)
  return c.json({ success: true, message: newMessage })
})

// Existing API routes...
app.get('/api/projects', (c) => {
  return c.json([
    { id: 1, title: 'AI Marketing Dashboard', category: 'AI Marketing' },
    { id: 2, title: 'Luxury E-commerce', category: 'Web Development' },
    { id: 3, title: 'Smart City Mobile App', category: 'Mobile Apps' }
  ])
})

const port = 3001
console.log(`🚀 Next-Gen Backend running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
