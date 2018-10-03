module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .changeColumn('Users', 'meta', {
      type: Sequelize.JSONB
    }),

  down: (queryInterface, Sequelize) => queryInterface
    .changeColumn('Users', 'meta', {
      type: Sequelize.JSONB,
      defaultValue: {
        occupationModificationCount: 0
      }
    })
};
