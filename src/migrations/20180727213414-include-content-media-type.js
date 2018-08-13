module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('contents', 'mediaType', {
      type: Sequelize.ENUM,
      values: ['image', 'video'],
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface
      .sequelize.query('DROP TYPE "enum_contents_mediaType";')
};
