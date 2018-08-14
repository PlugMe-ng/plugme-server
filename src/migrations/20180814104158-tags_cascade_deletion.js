module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.removeConstraint('tags', 'categoryId_foreign_idx')
      .then(() =>
        queryInterface.changeColumn('tags', 'categoryId', {
          type: Sequelize.UUID,
          references: {
            model: 'tags',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        })),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeConstraint('tags', 'categoryId_foreign_idx')
      .then(() =>
        queryInterface.changeColumn('tags', 'categoryId', {
          type: Sequelize.UUID,
          references: {
            model: 'tags',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        })),
};
