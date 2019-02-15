import capitalize from 'capitalize';

module.exports = (sequelize, DataTypes) => {
  const location = sequelize.define('location', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // get() {
      //   const title = this.getDataValue('name');
      //   return capitalize.words(title);
      // }
    },
  }, {});
  location.associate = (models) => {
    location.belongsTo(models.country);
    location.hasMany(models.opportunity);
    location.hasMany(models.localgovernment);
  };
  return location;
};
