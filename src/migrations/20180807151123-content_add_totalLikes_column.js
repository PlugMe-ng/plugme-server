module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('contents', 'totalLikes', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('contents', 'totalLikes')
};
