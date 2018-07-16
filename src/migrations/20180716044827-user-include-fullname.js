module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'fullName', {
      type: Sequelize.STRING,
      allowNull: false,
    }),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn('Users', 'fullName')
};
