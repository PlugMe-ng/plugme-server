module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('users_conversations', 'read', {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn('users_conversations', 'read')
};
