import capitalize from 'capitalize';

module.exports = (sequelize, DataTypes) => {
  const tag = sequelize.define('tag', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // set(value) {
      //   this.setDataValue('title', value.toLowerCase());
      // },
      // get() {
      //   const title = this.getDataValue('title');
      //   return title && capitalize.words(title);
      // },
    },
  }, {
    tableName: 'tags'
  });
  tag.associate = (models) => {
    tag.belongsTo(models.tag, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    tag.hasMany(models.tag, {
      as: 'minorTags',
      foreignKey: 'categoryId'
    });
    tag.belongsToMany(models.content, {
      through: 'contentTags',
      as: 'contents',
      foreignKey: 'tagId',
      otherKey: 'contentId'
    });
    tag.belongsToMany(models.User, {
      through: 'users_tags_interest',
      as: 'interestedUsers',
      foreignKey: 'tagId',
      otherKey: 'userId'
    });
    tag.belongsToMany(models.User, {
      as: 'skilledUsers',
      through: 'users_tags_skills',
      foreignKey: 'tagId',
      otherKey: 'userId'
    });
    tag.belongsToMany(models.opportunity, {
      through: 'opportunities_tags',
      as: 'opportunities',
      foreignKey: 'tagId',
      otherKey: 'opportunityId'
    });
  };
  return tag;
};
