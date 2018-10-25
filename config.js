'use strict';

module.exports = {
  PORT: process.env.PORT || 8080
};


module.exports = {
  PORT: process.env.PORT || 8080,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/noteful',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/noteful-test'
};
