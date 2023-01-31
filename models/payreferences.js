module.exports =(sequelize, DataTypes) => {
    const PaymentRef = sequelize.define('Paymentref', {
        flwRef: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cashPayRef: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        tableName: 'paymentref',
        underscored: true,
    })
    // paymentref associations  
    PaymentRef.associate = (models) => {
        PaymentRef.belongsTo(models.Booking, {
            foreignKey: 'booking_id',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
    return PaymentRef;
};
