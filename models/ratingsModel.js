module.exports = (sequelize, DataTypes) => {
    const Rating = sequelize.define('Rating', {
        ratingId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }       
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'ratings',
        timestamps: true
    });
    Rating.associate = (models) => {
        Rating.belongsTo(models.Booking, {
            foreignKey: 'booking_id',
            onDelete: 'CASCADE'
        });
    };

    return Rating;
};