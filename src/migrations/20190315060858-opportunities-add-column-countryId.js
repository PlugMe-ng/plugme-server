module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('opportunities', 'countryId', {
    type: Sequelize.UUID,
    references: {
      model: 'countries',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  }),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn('opportunities', 'countryId')
};
