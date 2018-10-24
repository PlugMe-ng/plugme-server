import models from '../models';

export default new class {
  create = async (req, res) => {
    try {
      const ad = await models.bannerAd.create(req.body);
      return res.sendSuccessAndLog(ad);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  get = async (req, res) => {
    try {
      const ads = await models.bannerAd.findAll();
      return res.sendSuccess(ads);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  update = async (req, res) => {
    try {
      const ad = await models.bannerAd.findByPk(req.params.id);
      if (!ad) throw new Error('Specified ad does not exist');
      await models.bannerAd.update(req.body, {
        where: { id: req.params.id }
      });
      return res.sendSuccessAndLog(ad, { message: 'Ad updated successfully' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  delete = async (req, res) => {
    try {
      const ad = await models.bannerAd.findByPk(req.params.id);
      if (!ad) throw new Error('Specified ad does not exist');
      await models.bannerAd.destroy({ where: { id: req.params.id } });
      return res.sendSuccessAndLog(ad, { message: 'Ad deleted successfully' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();
