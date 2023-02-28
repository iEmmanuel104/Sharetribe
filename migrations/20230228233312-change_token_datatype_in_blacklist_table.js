'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('blacklist', 'token', {
      type: DataTypes.TEXT('long'),
      allowNull: false
    });
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('blacklist', 'token', {
      type: DataTypes.STRING,
      allowNull: false
    });
  }
};
