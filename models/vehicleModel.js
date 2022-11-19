
module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
        vehicleId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        vehicleName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleModel: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleColor: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleStatus: {
            type: DataTypes.ENUM(["AVAILABLE", "UNAVAILABLE"]),
            allowNull: false
        },
        vehicleDescription: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleLocation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleCapacity: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
        },
        imagename: {
            type: DataTypes.STRING,
        },
        data: {
            type: DataTypes.BLOB('long'),
        },
    }, {
        tableName: 'vehicle',
        timestamps: false,
        underscored: true
    });
    Vehicle.associate = (models) => {
        Vehicle.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
    };
    return Vehicle;
};
