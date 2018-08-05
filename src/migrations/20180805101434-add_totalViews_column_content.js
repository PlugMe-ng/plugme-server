module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('contents', 'totalViews', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('contents', 'totalViews')
};
