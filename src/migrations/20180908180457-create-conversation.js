module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('conversations', {
    id: {
      primaryKey: true,
      type: Sequelize.UUID
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('conversations')
};
