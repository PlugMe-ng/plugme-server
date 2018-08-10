

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'hasPendingReview', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Users', 'hasPendingReview')
};
