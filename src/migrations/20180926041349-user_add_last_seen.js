module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'lastSeen', {
      type: Sequelize.DATE
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Users', 'lastSeen')
};
