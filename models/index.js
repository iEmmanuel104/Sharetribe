'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV 
const Pool = require('pg').Pool
const db = {};
const config  = require('../config/config.js')

let sequelize;
switch (env) {
  case 'production':
    const isProduction = process.env.NODE_ENV === 'production'
    const connectionString = isProduction ? process.env.DATABASE_URL : config.development
    const pool = new Pool({
      connectionString: connectionString,
    })
    sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    break;
  case 'testing':
    sequelize = new Sequelize(
      config.testing.database,
      config.testing.username,
      config.testing.password,
      {
        host: config.testing.host,
        dialect: config.testing.dialect,
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        } 
      }
    );
    break;
  default:
    sequelize = new Sequelize(
      config.development.database,
      config.development.username,
      config.development.password,
      {
        host: config.development.host,
        dialect: config.development.dialect,
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        }
      }
    );
}


// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
