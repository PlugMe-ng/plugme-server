import capitalize from 'capitalize';

module.exports = (sequelize, DataTypes) => {
  const minorTag = sequelize.define('minorTag', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('title', value.toLowerCase());
      },
      get() {
        const title = this.getDataValue('title');
        return capitalize.words(title);
      },
    },
  }, {});
  minorTag.associate = (models) => {
    minorTag.belongsTo(models.majorTag, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    minorTag.belongsToMany(models.content, {
      through: 'contentTags',
      as: 'contents',
      foreignKey: 'tagId',
      otherKey: 'contentId'
    });
  };
  return minorTag;
};
