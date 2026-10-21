module.exports = (err, _req, res, _next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({ message: field === 'email' ? 'Email already registered' : `${field || 'Record'} already exists` });
  }
  if (err.name === 'CastError') return res.status(404).json({ message: 'Not found' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : err.message,
    ...(err.details && { details: err.details }),
  });
};
