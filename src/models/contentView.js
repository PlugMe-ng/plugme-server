module.exports = (sequelize, DataTypes) => {
  const view = sequelize.define('view', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
  }, {
    tableName: 'contents_users_views'
  });

  view.associate = (models) => {
    view.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    view.belongsTo(models.content, {
      foreignKey: 'contentId'
    });
  };
  return view;
};
