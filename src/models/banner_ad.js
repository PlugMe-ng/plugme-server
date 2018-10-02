module.exports = (sequelize, DataTypes) => {
  const bannerAd = sequelize.define('bannerAd', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    url: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    }
  }, {
    tableName: 'banner_ads'
  });
  bannerAd.associate = (models) => {
    // associations can be defined here
  };
  return bannerAd;
};
