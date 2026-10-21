'use strict';

const { Router } = require('express');
const controller = require('../controllers/budget.controller');
const verifySession = require('../middleware/verifySession');

const router = Router();

router.get('/', verifySession, controller.get);
router.post('/', verifySession, controller.save);

module.exports = router;
