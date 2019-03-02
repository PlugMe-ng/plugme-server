module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'profileVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Users', 'profileVerified')
};
