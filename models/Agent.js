const {  DataTypes } = require('sequelize');
const sequelize = require('../models/index')

const  Agent= sequelize.define('agent', {
  // Model attributes are defined here

  firstname: {
    type: DataTypes.STRING
  },
  lastname: {
    type: DataTypes.STRING,
    unique: false
  },
  servicecharge: {
    type: DataTypes.JSON, // Store servicecharge as JSON
    allowNull: false,
  },
 
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },


  phonenumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gst: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
}, {
  tableName: 'agent'
});

module.exports=Agent
