module.exports = (sequelize, DataTypes) => {
  const comment = sequelize.define('comment', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {});
  comment.associate = (models) => {
    comment.belongsTo(models.User);
    comment.belongsTo(models.content);
  };
  return comment;
};
