module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.changeColumn('contents', 'mediaType', {
    type: Sequelize.STRING,
    allowNull: false
  }).then(() => {
    const pgEnumDropQuery = queryInterface.QueryGenerator.pgEnumDrop('contents', 'mediaType');
    return queryInterface.sequelize.query(pgEnumDropQuery);
  }).then(() => queryInterface.changeColumn('contents', 'mediaType', {
    type: Sequelize.ENUM('image', 'video', 'audio'),
    allowNull: false
  })),

  down: (queryInterface, Sequelize) => queryInterface.changeColumn('contents', 'mediaType', {
    type: Sequelize.STRING,
    allowNull: false
  }).then(() => {
    const pgEnumDropQuery = queryInterface.QueryGenerator.pgEnumDrop('contents', 'mediaType');
    return queryInterface.sequelize.query(pgEnumDropQuery);
  }).then(() => queryInterface.changeColumn('contents', 'mediaType', {
    type: Sequelize.ENUM('image', 'video'),
    allowNull: false
  }))
};
