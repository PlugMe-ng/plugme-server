module.exports = (sequelize, DataTypes) => {
  const localgovernment = sequelize.define('localgovernment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {});
  localgovernment.associate = (models) => {
    localgovernment.belongsTo(models.location);
  };
  return localgovernment;
};
