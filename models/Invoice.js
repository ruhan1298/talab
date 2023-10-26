const {  DataTypes } = require('sequelize');
const sequelize = require('../models/index')

const Invoice = sequelize.define('invoice', {
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passportData: {
      type: DataTypes.JSON, // Store passport data as JSON
      allowNull: true, // Allow null if no passports are added initially
    },
    iscash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Provide a default value
    },
    servicecharge:{
      type:DataTypes.INTEGER,
      allowNull:true

    },
    pdf:{
      type:DataTypes.BLOB,

    },

    // Add any other fields you need for the Agent model
  });

module.exports= Invoice
