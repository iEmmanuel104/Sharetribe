const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 50],
        notNull: {
          msg: "Please enter your full name"
        }
      }
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false, 
      validate: {
        len: [3, 50],
        notNull: {
          msg: "Please enter a username"
        }
      } 
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
        notNull: {
          msg: "Please enter an email address"
        }
        },
        allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(["ADMIN", "HOST", "GUEST"]),
      defaultValue: "GUEST",
      allowNull: false
   },
   verification_code: { 
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(["ACTIVE", "INACTIVE"]),
      defaultValue: "INACTIVE",
      allowNull: false
    },
    agedeclaration: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    terms: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
 }, {
        tableName: 'user',
        timestamps: false,
        underscored: true,
        hooks: {
            beforeCreate(user) {
                user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
                // user.username = user.username.toLowerCase();
                user.role = user.role.toUpperCase();
                user.status = user.status.toUpperCase();
            }
        },
    });

    User.prototype.toJSON = function() {
      const values = Object.assign({}, this.get());
      delete values.password;
      delete values.verification_code;

      return values;
    };
    User.associate = (models) => {
        User.hasMany(models.Vehicle, {
            onDelete: 'CASCADE',
            onUpdate : 'CASCADE'
        });
    };

  return User;
};
