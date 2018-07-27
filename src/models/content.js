

module.exports = (sequelize, DataTypes) => {
  const content = sequelize.define('content', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mediaUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  }, {});
  content.associate = (models) => {
    content.belongsTo(models.User, { as: 'author', foreignKey: 'authorId' });
    content.belongsToMany(models.minorTag, {
      through: 'contentTags',
      as: 'tags',
      foreignKey: 'contentId',
      otherKey: 'tagId'
    });
    content.belongsToMany(models.User, {
      through: 'contents_users_likes',
      as: 'likers',
      foreignKey: 'contentId',
      otherKey: 'userId'
    });
    content.hasMany(models.comment);
  };
  return content;
};
