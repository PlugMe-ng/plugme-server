

module.exports = (sequelize, DataTypes) => {
  const emailAuthAction = sequelize.define('emailAuthAction', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    token: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM,
      values: ['verify', 'reset']
    }
  }, {});
  emailAuthAction.associate = (models) => {
    emailAuthAction.belongsTo(models.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  };
  return emailAuthAction;
};
