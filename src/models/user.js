/**
 * @fileOverview user model
 *
 * @author Franklin Chieze
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    role: {
      type: DataTypes.ENUM,
      values: [
        'admin', 'disabled', 'member'
      ],
      defaultValue: 'member'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  User.associate = (models) => {
    User.hasOne(
      models.emailAuthAction,
      { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    );
  };

  return User;
};
