const { Client } = require('@elastic/elasticsearch');

// Does not connect until the first request, so requiring this file is always safe.
module.exports = new Client({ node: process.env.ELASTIC_URL || 'http://localhost:9200' });
