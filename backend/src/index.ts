import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import portfolioRoutes from './routes/portfolio';
import swaggerUi from 'swagger-ui-express';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple Swagger docs (could use swagger-jsdoc for more detail)
const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'PrimeTrade API', version: '1.0.0' },
  paths: {}
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
