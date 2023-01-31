module.exports = (sequelize, DataTypes) => {
    const AccountDetails = sequelize.define('AccountDetails', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        bankName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        timestamps: false,
    });
    
    AccountDetails.associate = (models) => {
        AccountDetails.belongsTo(models.User, {
            foreignKey: 'user_id',
            onDelete: 'CASCADE',
        });
    };
    
    return AccountDetails;
    }