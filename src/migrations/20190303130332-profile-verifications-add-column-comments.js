module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('profile_verifications', 'comment', {
      type: Sequelize.TEXT
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('profile_verifications', 'comment')
};
