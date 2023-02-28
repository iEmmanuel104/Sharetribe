
module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
        vehicleId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        vehicleMake: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleModel: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleCondition: {
            type: DataTypes.ENUM(["New", "Used"]),
            allowNull: false
        },
        vehicleType: {  
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleYear: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleTransmission: {
            type: DataTypes.ENUM(["Manual", "Automatic"]),
            allowNull: false
        },
        vehicleFuel: {
            type: DataTypes.ENUM(["Gasoline", "Diesel", "Electric"]),
            allowNull: false
        },
        vehicleColor: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleDoors: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleCapacity: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehiclerate: {
            type: DataTypes.STRING,
            allowNull: false
        },        
        vehicleDescription: {
            type: DataTypes.STRING,
            allowNull: false
        },  
        vehiclePlateNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleIdNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleRegistrationDate: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vehicleStatus: {
            type: DataTypes.ENUM(["AVAILABLE", "UNAVAILABLE"]),
            defaultValue: "UNAVAILABLE",
            allowNull: false
        },
        vehicleLocation: {
            type: DataTypes.STRING,
            allowNull: false
        },          
        vehicleImages: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false
        },
        isverified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        isbooked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        rentperiod: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        banner: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'vehicle',
        underscored: true
    });
    Vehicle.associate = (models) => {
        Vehicle.belongsTo(models.User, {
            foreignKey: 'user_id',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
        Vehicle.hasMany(models.Booking, {
            foreignKey: 'vehicle_id',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
    };
    return Vehicle;
};
