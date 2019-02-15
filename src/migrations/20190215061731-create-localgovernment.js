module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('localgovernments', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    locationId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'locations',
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('localgovernments')
};
