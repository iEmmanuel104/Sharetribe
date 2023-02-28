'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    return queryInterface.addColumn('vehicle', 'banner', {
      type: DataTypes.STRING,
    });
  },

  async down(queryInterface, DataTypes) {
    return queryInterface.removeColumn('vehicle', 'banner');
  }
};
