module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('opportunities', 'verifiedAchieversOnly', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('opportunities', 'verifiedAchieversOnly')
};
