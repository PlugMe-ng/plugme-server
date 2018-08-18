module.exports = (sequelize, DataTypes) => {
  const adminAction = sequelize.define('adminAction', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    action: DataTypes.TEXT,
    meta: DataTypes.JSONB
  }, {
    tableName: 'admin_actions'
  });
  adminAction.associate = (models) => {
    adminAction.belongsTo(models.User, { foreignKey: 'userId' });
  };
  return adminAction;
};
