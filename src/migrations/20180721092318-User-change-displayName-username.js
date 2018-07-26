module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.renameColumn('Users', 'displayName', 'username')
      .then(() =>
        queryInterface.addConstraint('Users', ['username'], {
          type: 'unique',
          name: 'Users_username_key'
        })),

  down: (queryInterface, Sequelize) => queryInterface
    .removeConstraint('Users', 'Users_username_key')
    .then(() => queryInterface.addColumn('Users', 'displayName', {
      type: Sequelize.STRING,
      allowNull: false
    }))
};
