module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .changeColumn('Users', 'meta', {
      type: Sequelize.JSONB,
      defaultValue: {
        profileModificationCount: 0
      }
    }),

  down: (queryInterface, Sequelize) => queryInterface
    .changeColumn('Users', 'meta', {
      type: Sequelize.JSONB
    })
};
