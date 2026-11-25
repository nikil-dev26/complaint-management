import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
} from '../controllers/complaintController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), createComplaint);
router.get('/my', protect, getMyComplaints);

router.get('/', protect, adminOnly, getAllComplaints);
router.patch('/:id/status', protect, adminOnly, updateComplaintStatus);
router.delete('/:id', protect, adminOnly, deleteComplaint);

export default router;