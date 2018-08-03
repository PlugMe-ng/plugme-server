

module.exports = (sequelize, DataTypes) => {
  const opportunity = sequelize.define('opportunity', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    positionNeeded: {
      type: DataTypes.STRING,
      allowNull: false
    },
    responsibilities: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    professionalDirection: {
      type: DataTypes.STRING,
      allowNull: false
    },
    budget: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false
    },
  }, {});

  opportunity.associate = (models) => {
    opportunity.belongsTo(models.location);
    opportunity.belongsTo(models.User, {
      as: 'plugger',
      foreignKey: 'pluggerId'
    });
    opportunity.belongsToMany(models.tag, {
      through: 'opportunities_tags',
      as: 'tags',
      foreignKey: 'opportunityId',
      otherKey: 'tagId'
    });
  };
  return opportunity;
};
