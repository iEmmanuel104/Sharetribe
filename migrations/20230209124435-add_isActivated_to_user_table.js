'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    return queryInterface.addColumn('user', 'isActivated', {
      type: DataTypes.BOOLEAN, 
      defaultValue: true,
      allowNull: false
    });
  },

  async down(queryInterface, DataTypes) {
    return queryInterface.removeColumn('user', 'isActivated');
  }
};
