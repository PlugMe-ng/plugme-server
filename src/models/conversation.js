module.exports = (sequelize, DataTypes) => {
  const conversation = sequelize.define('conversation', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
  }, {});
  conversation.associate = (models) => {
    conversation.belongsToMany(models.User, {
      as: 'participants',
      foreignKey: 'conversationId',
      otherKey: 'participantId',
      through: 'users_conversations'
    });
  };
  return conversation;
};
