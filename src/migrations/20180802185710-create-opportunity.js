module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('opportunities', {
    id: {
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    positionNeeded: {
      type: Sequelize.STRING,
      allowNull: false
    },
    responsibilities: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    professionalDirection: {
      type: Sequelize.STRING,
      allowNull: false
    },
    budget: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    deadline: {
      type: Sequelize.DATE,
      allowNull: false
    },
    locationId: {
      type: Sequelize.UUID,
      references: {
        model: 'locations',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    pluggerId: {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('opportunities')
};
