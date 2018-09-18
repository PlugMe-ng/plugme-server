module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('Users', 'plan', {
    type: Sequelize.JSONB,
    defaultValue: {
      type: 'basic',
      expiresAt: null
    }
  }),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn('Users', 'plan')
};
