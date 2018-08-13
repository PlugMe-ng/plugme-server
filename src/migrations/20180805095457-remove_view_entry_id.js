module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.removeConstraint('contents_users_views', 'contents_users_views_pkey')
      .then(() =>
        queryInterface.removeIndex('contents_users_views', 'contents_users_views_pkey'))
      .then(() => queryInterface.removeColumn('contents_users_views', 'id')),

  down: (queryInterface, Sequelize) =>
    queryInterface.dropTable('contents_users_views').then(() =>
      queryInterface.createTable('contents_users_views', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
        },
        contentId: {
          type: Sequelize.UUID,
          references: {
            model: 'contents',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        userId: {
          type: Sequelize.UUID,
          references: {
            model: 'Users',
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
      }))
};
