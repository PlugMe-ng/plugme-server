/* eslint-disable no-use-before-define */
import models from '../../models';

export default async (req, res) => {
  const { opportunityId } = req.params;
  try {
    const opportunity = await models.opportunity.findByPk(opportunityId, {
      attributes: [],
      include: associations()
    });
    if (!opportunity) throw new Error('Specified job does not exist');

    let { plugEntries: users } = opportunity.get({ plain: true });
    users = computeStats(users);
    sortUsers(users);

    return res.sendSuccess(users);
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};

const associations = () => [{
  model: models.User,
  as: 'plugEntries',
  through: { attributes: ['createdAt'] },
  attributes: ['id', 'username', 'fullName', 'photo'],
  include: [{
    model: models.occupation,
    attributes: ['title']
  }, {
    model: models.content,
    as: 'contents',
    attributes: ['totalViews', 'totalLikes'],
    include: [{
      model: models.comment,
      attributes: ['id']
    }]
  }, {
    model: models.opportunity,
    as: 'achievements',
    where: { status: 'done' },
    required: false,
    attributes: ['id'],
    include: [{
      model: models.review,
      attribute: ['rating', 'UserId']
    }]
  }]
}];

const computeStats = users => users.map((user) => {
  user = {
    ...user,
    ...user.contents.reduce((accumulated, content) => ({
      totalLikes: accumulated.totalLikes + content.totalLikes,
      totalViews: accumulated.totalViews + content.totalViews,
      totalComments: accumulated.totalComments + content.comments.length
    }), { totalLikes: 0, totalViews: 0, totalComments: 0 }),
    totalAchievements: user.achievements.length,
    averageRating: user.achievements
      .reduce((ratingsTotal, achievement) => ratingsTotal + achievement.reviews
        .filter(review => review.UserId !== user.id)[0].rating, 0)
        / (user.achievements.length || 1)
  };
  delete user.contents;
  delete user.achievements;
  return user;
});


/**
 * Sort users in place by averageRating -> totalAchievements -> createdAt
 *
 * @param {any} users
 * @returns {void}
 */
const sortUsers = (users) => {
  users.sort((userA, userB) => userB.averageRating - userA.averageRating)
    .sort((userA, userB) => userB.totalAchievements - userA.totalAchievements)
    .sort((userA, userB) => userB.users_opportunities_applications.createdAt
        - userA.users_opportunities_applications.createdAt);
};
