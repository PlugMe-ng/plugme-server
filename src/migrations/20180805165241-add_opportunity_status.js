module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('opportunities', 'status', {
      type: Sequelize.ENUM,
      values: ['available', 'pending', 'done'],
      defaultValue: 'available'
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface
      .sequelize.query('DROP TYPE "enum_opportunities_status";')
      .then(() => queryInterface.removeColumn('opportunities', 'status'))
};
