'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('booking', {
      bookingId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      hostId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      startDate: {
        type: Sequelize.STRING,
        allowNull: false
      },
      endDate: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fromLocation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bookingStatus: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Cancelled'),
        allowNull: false
      },
      bookingRate: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bookingAmount: {
        type: Sequelize.STRING,
        allowNull: false
      },
      paymentStatus: {
        type: Sequelize.ENUM('Pending', 'Paid'),
        allowNull: false
      },
      paymentReference: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('booking');
  }
};
