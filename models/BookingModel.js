module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
        bookingId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        hostUser : {
            type: DataTypes.STRING,
            allowNull: false
        },
        startDate: {
            type: DataTypes.STRING,
            allowNull: false
        },
        endDate: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fromLocation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        toLocation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bookingStatus: {
            type: DataTypes.ENUM(["Pending", "Approved", "Cancelled"]),
            allowNull: false,
            defaultValue: "Pending"
        },
        bookingRate: { 
            type: DataTypes.STRING,
            allowNull: false
        },
        bookingAmount: {
            type: DataTypes.STRING,
            allowNull: false
        },
        paymentStatus: {
            type: DataTypes.ENUM(["Pending", "Paid"]),
            allowNull: false,
            defaultValue: "Pending"
        },
        paymentReference: {
            type: DataTypes.STRING,
            allowNull: false
        },
        userApproval: {
            type: DataTypes.ENUM(["Pending", "Approved", "Cancelled"]),
            allowNull: false,
            defaultValue: "Pending"
        },
        hostApproval: {
            type: DataTypes.ENUM(["Pending", "Approved", "Cancelled"]),
            allowNull: false,
            defaultValue: "Pending"
        },
    }, {
        tableName: 'booking',
        underscored: true,
        hooks: {
                // set booking status to approved if user and host approves
                beforeUpdate: async (booking, options) => {
                    if (booking.userApproval === "Approved" && booking.hostApproval === "Approved") {
                        booking.bookingStatus = "Approved";
                    }
                    if (booking.userApproval === "Cancelled" || booking.hostApproval === "Cancelled") {
                        booking.bookingStatus = "Cancelled";
                    }
                }
                // capita
            }
    });
    // bookings associations
    Booking.associate = (models) => {
        Booking.belongsTo(models.User, {
            foreignKey: 'user_id',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
        Booking.belongsTo(models.Vehicle, {
            foreignKey: 'vehicle_id',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
        Booking.hasOne(models.Rating, {
            foreignKey: 'booking_id',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
        Booking.hasOne(models.Paymentref, {
            foreignKey: 'booking_id',
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });

    }
    return Booking;
};
