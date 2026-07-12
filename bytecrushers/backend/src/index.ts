import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import adminRoutes from './routes/admin.routes';
import { requireAuth } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Allow all origins for the hackathon demo flexibility
  credentials: true
}));

app.use(express.json());

// Base Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'AssetFlow ERP API' });
});

// Identity Profile Route - accessible by any authenticated employee
app.get('/api/me', requireAuth, (req: any, res) => {
  return res.status(200).json({
    user: req.user,
    employee: req.employee
  });
});

// Admin routes with built-in RBAC
app.use('/api/admin', adminRoutes);

// Serve Frontend Static Files (Vite Production Build)
const distPath = path.resolve(process.cwd(), 'frontend/dist');
app.use(express.static(distPath));

// SPA Fallback Route
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error occurred' });
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`⚡️[server]: AssetFlow API running at http://0.0.0.0:${port}`);
});
