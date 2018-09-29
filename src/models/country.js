
import capitalize from 'capitalize';

module.exports = (sequelize, DataTypes) => {
  const country = sequelize.define('country', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // set(value) {
      //   this.setDataValue('name', value.toLowerCase());
      // },
      // get() {
      //   const title = this.getDataValue('name');
      //   return capitalize.words(title);
      // }
    },
  }, {});
  country.associate = (models) => {
    country.hasMany(models.location);
  };
  return country;
};
