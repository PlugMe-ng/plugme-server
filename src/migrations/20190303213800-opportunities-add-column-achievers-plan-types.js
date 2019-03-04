module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize
      .query(`
        CREATE TYPE plans AS ENUM ('basic', 'professional', 'business');
       ALTER TABLE opportunities ADD allowedPlans plans[] DEFAULT ('{basic, professional, business}');`),

  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('opportunities', 'allowedplans')
      .then(() => queryInterface.sequelize.query(`DROP TYPE plans`)) // eslint-disable-line
};
