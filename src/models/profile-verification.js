module.exports = (sequelize, DataTypes) => {
  const profileVerification = sequelize.define('profileVerification', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    documents: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'profile_verifications'
  });
  profileVerification.associate = (models) => {
    profileVerification.belongsTo(models.User, { foreignKey: 'userId' });
  };
  return profileVerification;
};
