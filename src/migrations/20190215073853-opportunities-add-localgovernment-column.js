module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('opportunities', 'lgaId', {
      type: Sequelize.UUID,
      references: {
        model: 'localgovernments',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('opportunities', 'lgaId')
};
