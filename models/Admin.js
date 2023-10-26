const {  DataTypes } = require('sequelize');
const sequelize = require('../models/index')

const Admin = sequelize.define('admin_tb', {
  // Model attributes are defined here
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING
  },
  firstname: {
    type: DataTypes.STRING
  },
  lastname: {
    type: DataTypes.STRING,
    unique: false
  },
  phonenumber: {
    type: DataTypes.STRING,
    unique: false
  },
  profileImages: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin', // Set the default role value
    allowNull: false,
  },
  iscreate_invoice:{
    type:DataTypes.STRING,
    defaultValue:'0'
  }
}, {
  tableName: 'admin_tb'
});
module.exports=Admin
