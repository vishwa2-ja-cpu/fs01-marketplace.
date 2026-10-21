const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');
const AppError = require('./utils/AppError');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/vendors', require('./routes/vendor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));
// Next steps add: /api/search, /api/cart, /api/orders ...

app.use((_req, _res, next) => next(new AppError(404, 'Route not found')));
app.use(errorHandler);

module.exports = app;
