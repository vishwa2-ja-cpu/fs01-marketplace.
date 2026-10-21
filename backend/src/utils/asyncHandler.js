// Lets controllers be async without try/catch everywhere.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
