const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

module.exports = (req, _res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : next(new AppError(404, 'Not found'));
