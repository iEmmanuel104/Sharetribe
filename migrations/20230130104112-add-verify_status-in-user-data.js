'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'userdata',
      'isverifystatus',
      {
        type: DataTypes.ENUM('Pending', 'Submitted', 'Verified', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('userdata', 'isverifystatus');
  }
};

