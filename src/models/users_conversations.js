module.exports = (sequelize, DataTypes) => {
  const usersConversations = sequelize.define('users_conversations', {
  }, {
    tableName: 'users_conversations'
  });
  usersConversations.associate = (models) => {
  };
  return usersConversations;
};
