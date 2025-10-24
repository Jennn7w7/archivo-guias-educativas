const app = require('../server');

// Para Vercel serverless functions
module.exports = (req, res) => {
  return app(req, res);
};

module.exports.default = module.exports;