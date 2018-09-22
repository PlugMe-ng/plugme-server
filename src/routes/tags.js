import { Router } from 'express';

import middlewares from '../middleware';
import { tags as validations } from '../validations';
import { tags as controller } from '../controllers';

const {
  auth, check, filter, sort
} = middlewares;

const routes = new Router();

routes.get('/', sort, filter, controller.getTags);
routes.get('/minor', sort, filter, controller.getTags);
routes.get('/major', sort, filter, controller.getTags);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post('/major', validations.createMajorTag, controller.createTag);
routes.post('/minor', validations.createMinorTag, controller.createTag);
routes.delete('/:tagId', controller.deleteTag);

export default routes;
