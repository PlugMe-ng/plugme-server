module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.renameTable('emailVerifications', 'emailAuthActions')
      .then(() =>
        queryInterface.addColumn('emailAuthActions', 'type', {
          type: Sequelize.ENUM,
          values: ['verify', 'reset']
        })),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('emailAuthActions', 'type')
      .then(() => queryInterface
        .sequelize.query('DROP TYPE "enum_emailAuthActions_type";'))
      .then(() => queryInterface.renameTable('emailAuthActions', 'emailVerifications'))
};
