module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'lgaId', {
      type: Sequelize.UUID,
      references: {
        model: 'localgovernments',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Users', 'lgaId')
};
