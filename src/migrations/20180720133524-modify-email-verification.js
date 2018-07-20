module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('emailVerifications', 'type', {
      type: Sequelize.ENUM,
      values: ['verify', 'reset']
    }).then(() =>
      queryInterface.renameTable('emailVerifications', 'emailAuthActions')),

  down: (queryInterface, Sequelize) =>
    queryInterface.renameTable('emailAuthActions', 'emailVerifications')
      .then(() =>
        queryInterface.removeColumn('emailVerifications', 'type'))
};
