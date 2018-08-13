module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.changeColumn('minorTags', 'categoryId', {
      type: Sequelize.UUID,
      references: {
        model: 'minorTags',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }).then(() => {
      queryInterface.renameTable('minorTags', 'tags').then(() =>
        queryInterface.dropTable('majorTags'));
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.createTable('majorTags', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(() => queryInterface.renameTable('tags', 'minorTags'))
      .then(() => queryInterface.changeColumn('minorTags', 'categoryId', {
        type: Sequelize.UUID,
        references: {
          model: 'majorTags',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }))
};
