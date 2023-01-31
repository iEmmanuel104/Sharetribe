module.exports = (sequelize, Sequelize) => {
    const PaymentDetails = sequelize.define("paymentDetails", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        cardNumber: {
            type: Sequelize.STRING,
            allowNull: false
        },
        cardHolderName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        expiryDate: {
            type: Sequelize.STRING,
            allowNull: false
        },
        cvv: {
            type: Sequelize.STRING,
            allowNull: false
        }
    },
    { 
        tableName: 'paymentDetails',
        underscored: true
     });
    //  associate with user
    PaymentDetails.associate = function(models) {
        PaymentDetails.belongsTo(models.User, {
            foreignKey: { 
                name: 'user_id',
                allowNull: false
            },
            onDelete: 'CASCADE'
        });
    };


    return PaymentDetails;
};
