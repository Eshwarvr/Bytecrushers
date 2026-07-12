import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

router.use(requireAuth);

router.get('/', bookingController.listBookings);
router.post('/', bookingController.createBooking);
router.delete('/:id', bookingController.deleteBooking);

export default router;
