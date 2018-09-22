const applyFilterMeta = (req) => {
  req.meta = req.meta || {};
  req.meta.filter = req.meta.filter || {};
  req.meta.filter.where = req.meta.filter.where || {};

  const { query } = req;

  const filterObject = {};
  Object.keys(query).forEach((key) => {
    if (!key.startsWith('@')) filterObject[key] = query[key];
  });

  req.meta.filter.where = { ...req.meta.filter.where, ...filterObject };
};

const applyPaginationMeta = (req) => {
  req.meta = req.meta || {};
  req.meta.pagination = req.meta.pagination || {};

  let limit = req.query['@limit'] ? Number(req.query['@limit']) || 20 : 20;
  if (limit < 1) limit = 1;

  let offset = 0;

  if (req.query['@offset']) {
    offset = Number(req.query['@offset']) || 0;
  } else if (req.query['@page']) {
    let page = Number(req.query['@page']) || 1;
    if (page < 1) page = 1;
    offset = (page - 1) * limit;
  }

  if (offset < 0) offset = 0;
  req.meta.pagination = { ...req.meta.pagination, limit, offset };
};

const applySearchMeta = (req) => {
  req.meta = req.meta || {};
  req.meta.search = req.meta.search || {};

  const query = req.query['@search'] || '';
  req.meta.search = { ...req.meta.search, query };
};

const applySortMeta = (req) => {
  req.meta = req.meta || {};
  req.meta.sort = req.meta.sort || {};

  const attribute = req.query['@sort'] || 'createdAt';
  const order = req.query['@order'] || 'DESC';

  req.meta.sort = { ...req.meta.sort, attribute, order };
};

export default (req, res, next) => {
  req.meta = req.meta || {};
  applyFilterMeta(req);
  applyPaginationMeta(req);
  applySearchMeta(req);
  applySortMeta(req);

  return next();
};
