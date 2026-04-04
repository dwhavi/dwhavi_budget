import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.get('/api/auth/me', (_req, res) => {
  res.status(401).json({ success: false, message: '인증이 필요합니다' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;