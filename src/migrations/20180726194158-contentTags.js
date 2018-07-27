module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('contentTags', {
      contentId: {
        type: Sequelize.UUID,
        references: {
          model: 'contents',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tagId: {
        type: Sequelize.UUID,
        references: {
          model: 'minorTags',
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
    queryInterface.dropTable('contentTags')
};
