module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('messages', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    senderId: {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    conversationId: {
      type: Sequelize.UUID,
      references: {
        model: 'conversations',
        key: 'id'
      },
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('messages')
};
