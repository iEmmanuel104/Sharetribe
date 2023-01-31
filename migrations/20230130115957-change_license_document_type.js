'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'userdata',
      'license_document',
      {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      }
    );
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'userdata',
      'license_document',
    );
  },
};

