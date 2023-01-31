module.exports = (sequelize, DataTypes) => {
    const UserData = sequelize.define('UserData', {
        userDataId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        employer: {
            type: DataTypes.STRING,
            allowNull: true
        },
        branch: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        licenseDocument: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true
        },
        verifyStatus: {
            type: DataTypes.ENUM('Pending', 'Submitted', 'Verified', 'Rejected'),
            allowNull: false,
            defaultValue: 'Pending'
        },
        userImage : {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        tableName: 'userdata',
        underscored: true
    });

    UserData.associate = (models) => {
        UserData.belongsTo(models.User, {
            foreignKey: 'user_id',
            onDelete: 'CASCADE'
        });
    };
    return UserData;
};



// 1cc7ebf1-bca1-4a63-bb81-c0e45e5825a2
// e0423d5d-2973-4e32-8ab2-498e5f103b90