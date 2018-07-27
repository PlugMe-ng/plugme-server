import capitalize from 'capitalize';

module.exports = (sequelize, DataTypes) => {
  const majorTag = sequelize.define('majorTag', {
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
  majorTag.associate = (models) => {
    majorTag.hasMany(models.minorTag, {
      foreignKey: 'categoryId'
    });
  };
  return majorTag;
};
