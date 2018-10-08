module.exports = (sequelize, DataTypes) => {
  const message = sequelize.define('message', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {});
  message.associate = (models) => {
    message.belongsTo(models.conversation, {
      foreignKey: 'conversationId'
    });
    message.belongsTo(models.User, {
      as: 'sender',
      foreignKey: 'senderId'
    });
  };
  return message;
};
