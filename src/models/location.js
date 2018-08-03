module.exports = (sequelize, DataTypes) => {
  const location = sequelize.define('location', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {});
  location.associate = (models) => {
    location.belongsTo(models.country);
    location.hasMany(models.opportunity);
  };
  return location;
};
