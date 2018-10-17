module.exports = (sequelize, DataTypes) => {
  const userConversation = sequelize.define('user_conversation', {
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users_conversations'
  });
  userConversation.associate = (models) => {
    userConversation.belongsTo(models.conversation);
    userConversation.belongsTo(models.User, { foreignKey: 'participantId' });
  };
  return userConversation;
};
