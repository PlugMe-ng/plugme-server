module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.changeColumn('Users', 'plan', {
    type: Sequelize.JSONB,
    defaultValue: {
      type: 'pro',
      expiresAt: null
    }
  }),

  down: (queryInterface, Sequelize) => queryInterface.changeColumn('Users', 'plan', {
    type: Sequelize.JSONB,
    defaultValue: {
      type: 'basic',
      expiresAt: null
    }
  }),
};
