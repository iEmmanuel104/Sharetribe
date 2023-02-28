module.exports = (sequelize, DataTypes) => {
    const Blacklist = sequelize.define('Blacklist', {
        token: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        }
    }, {
        tableName: 'blacklist',
        timestamps: false,
        underscored: true
    });
    return Blacklist;
};
