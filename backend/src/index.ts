import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import portfolioRoutes from './routes/portfolio';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'PrimeTrade API Docs',
  customJs: '/swagger-custom.js',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    displayRequestDuration: true,
  },
}));

app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerDocument);
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
