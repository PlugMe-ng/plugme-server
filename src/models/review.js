

module.exports = (sequelize, DataTypes) => {
  const review = sequelize.define('review', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    comment: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    rating: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
  }, {});
  review.associate = (models) => {
    review.belongsTo(models.User);
    review.belongsTo(models.opportunity);
  };
  return review;
};
