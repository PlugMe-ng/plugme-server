module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'meta', {
      type: Sequelize.JSONB,
      defaultValue: {
        occupationModificationCount: 0
      }
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Users', 'meta')
};
