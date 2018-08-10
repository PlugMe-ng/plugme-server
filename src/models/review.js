

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


module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('reviews', {
    id: {
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    comment: {
      allowNull: false,
      type: Sequelize.TEXT
    },
    rating: {
      allowNull: false,
      type: Sequelize.INTEGER
    },
    UserId: {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    opportunityId: {
      type: Sequelize.UUID,
      references: {
        model: 'opportunities',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('reviews')
};
