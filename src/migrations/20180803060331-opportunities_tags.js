module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('opportunities_tags', {
      opportunityId: {
        type: Sequelize.UUID,
        references: {
          model: 'opportunities',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tagId: {
        type: Sequelize.UUID,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.dropTable('opportunities_tags')
};
