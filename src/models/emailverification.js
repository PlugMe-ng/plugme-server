

module.exports = (sequelize, DataTypes) => {
  const emailVerification = sequelize.define('emailVerification', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    token: {
      type: DataTypes.STRING
    },
  }, {});
  emailVerification.associate = (models) => {
    emailVerification.belongsTo(models.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  };
  return emailVerification;
};
