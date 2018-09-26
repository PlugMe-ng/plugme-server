import { Router } from 'express';

import middlewares from '../middleware';
import { tags as validations } from '../validations';
import { tags as controller } from '../controllers';

const { auth, check } = middlewares;

const router = new Router();

router.get('/', controller.getTags);
router.get('/minor', controller.getTags);
router.get('/major', controller.getTags);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.post('/major', validations.createMajorTag, controller.createTag);
router.post('/minor', validations.createMinorTag, controller.createTag);
router.delete('/:tagId', controller.deleteTag);
router.put('/:tagId', controller.updateTag);

export default router;
