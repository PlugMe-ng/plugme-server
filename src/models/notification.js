module.exports = (sequelize, DataTypes) => {
  const notification = sequelize.define('notification', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    meta: {
      type: DataTypes.JSONB
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {});
  notification.associate = (models) => {
    notification.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    notification.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
  };
  return notification;
};
