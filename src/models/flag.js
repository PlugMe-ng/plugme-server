module.exports = (sequelize, DataTypes) => {
  const flag = sequelize.define('flag', {
    info: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'contents_users_flags'
  });
  return flag;
};
