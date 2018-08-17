module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'locationId', {
      type: Sequelize.UUID,
      references: {
        model: 'locations',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }).then(() => queryInterface.addColumn('Users', 'occupationId', {
      type: Sequelize.UUID,
      references: {
        model: 'occupations',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Users', 'locationId')
      .then(() =>
        queryInterface.removeColumn('Users', 'occupationId')),
};
