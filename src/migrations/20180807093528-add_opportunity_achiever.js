module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('opportunities', 'achieverId', {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('opportunities', 'achieverId')
};
