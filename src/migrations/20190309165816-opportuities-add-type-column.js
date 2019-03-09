module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('opportunities', 'type', {
    type: Sequelize.STRING
  }),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn('opportunities', 'type')
};
