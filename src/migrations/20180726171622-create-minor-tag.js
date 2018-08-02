

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('minorTags', {
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
    categoryId: {
      type: Sequelize.UUID,
      references: {
        key: 'id',
        model: 'majorTags'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('minorTags')
};
