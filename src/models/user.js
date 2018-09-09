/**
 * @fileOverview user model
 *
 * @author Franklin Chieze
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      },
      set(value) {
        this.setDataValue('username', value.toLowerCase());
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    role: {
      type: DataTypes.ENUM,
      values: [
        'admin', 'disabled', 'member'
      ],
      defaultValue: 'member'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hasPendingReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    meta: {
      type: DataTypes.JSONB
    }
  }, {
    getterMethods: {
      bio() {
        return this.meta ? this.meta.bio : null;
      },
      experience() {
        return this.meta ? this.meta.experience : null;
      }
    }
  });

  User.associate = (models) => {
    User.hasOne(
      models.emailAuthAction,
      { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    );

    User.belongsToMany(
      models.User,
      {
        through: 'UserFans',
        as: 'fans',
        foreignKey: 'UserId',
        otherKey: 'fanId'
      }
    );

    User.belongsToMany(
      models.User,
      {
        through: 'UserFans',
        as: { singular: 'fanOf', plural: 'fansOf' },
        foreignKey: 'fanId',
        otherKey: 'UserId'
      }
    );

    User.hasMany(
      models.content,
      {
        as: 'contents',
        foreignKey: 'authorId'
      }
    );

    User.belongsToMany(models.content, {
      through: 'contents_users_likes',
      as: 'likedContents',
      foreignKey: 'userId',
      otherKey: 'contentId'
    });

    User.belongsToMany(models.content, {
      through: 'contents_users_views',
      as: 'viewedContents',
      foreignKey: 'userId',
      otherKey: 'contentId'
    });

    User.belongsToMany(models.content, {
      through: models.flag,
      as: 'flaggedContents',
      foreignKey: 'userId',
      otherKey: 'contentId'
    });

    User.hasMany(models.comment);
    User.belongsToMany(models.tag, {
      as: 'interests',
      through: 'users_tags_interest',
      foreignKey: 'userId',
      otherKey: 'tagId'
    });
    User.belongsToMany(models.tag, {
      as: 'skills',
      through: 'users_tags_skills',
      foreignKey: 'userId',
      otherKey: 'tagId'
    });
    User.hasMany(models.opportunity, {
      foreignKey: 'pluggerId'
    });
    User.belongsToMany(models.opportunity, {
      through: 'users_opportunities_applications',
      as: 'appliedOpportunities',
      foreignKey: 'userId',
      otherKey: 'opportunityId'
    });
    User.hasMany(models.opportunity, {
      as: 'achievements',
      foreignKey: 'achieverId'
    });
    User.hasMany(models.review);
    User.belongsTo(models.occupation);
    User.belongsTo(models.location);
    User.belongsToMany(models.conversation, {
      through: 'users_conversations',
      as: 'conversations',
      foreignKey: 'participantId',
      otherKey: 'conversationId'
    });
  };

  return User;
};
