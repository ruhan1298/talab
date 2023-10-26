const {  DataTypes } = require('sequelize');
const sequelize = require('../models/index')

const  Template= sequelize.define('template', {
  // Model attributes are defined here
    template: {
        type: DataTypes.TEXT, // Change the data type to TEXT
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false, // Do not allow null values
        defaultValue: 0, // Default value if not provided
      },
      
    template_name: {
      type: DataTypes.STRING,
    },
    
  });

module.exports=Template
