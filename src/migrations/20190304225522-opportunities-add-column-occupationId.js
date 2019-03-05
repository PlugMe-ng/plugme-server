module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('opportunities', 'occupationId', {
      type: Sequelize.UUID,
      references: {
        model: 'occupations',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }).then(() =>
      queryInterface
        .removeColumn('opportunities', 'positionNeeded')),

  down: (queryInterface, Sequelize) =>
    queryInterface.addColumn('opportunities', 'positionNeeded', {
      type: Sequelize.STRING
    }).then(() => queryInterface.removeColumn('opportunities', 'occupationId')),
};
