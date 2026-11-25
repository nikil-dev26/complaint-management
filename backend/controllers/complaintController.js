import fs from 'fs';
import path from 'path';
import Complaint from '../models/Complaint.js';

export const createComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const complaint = await Complaint.create({
      title,
      description,
      category,
      image: imagePath,
      userId: req.user._id,
    });

    const populatedComplaint = await complaint.populate('userId', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.emit('newComplaint', populatedComplaint);
    }

    return res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: populatedComplaint,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error creating complaint: ${error.message}` });
  }
};

export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(complaints);
  } catch (error) {
    return res.status(500).json({ message: `Error fetching complaints: ${error.message}` });
  }
};

export const getAllComplaints = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(complaints);
  } catch (error) {
    return res.status(500).json({ message: `Error fetching all complaints: ${error.message}` });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'In Progress', 'Resolved'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('complaintStatusUpdated', complaint);
    }

    return res.status(200).json({
      message: 'Status updated successfully',
      complaint,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error updating status: ${error.message}` });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.image) {
      const filePath = path.resolve(complaint.image.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
        } catch (fileErr) {
          console.error('Failed to remove image file:', fileErr.message);
        }
      }
    }

    await complaint.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.emit('complaintDeleted', { id });
    }

    return res.status(200).json({ message: 'Complaint deleted successfully', id });
  } catch (error) {
    return res.status(500).json({ message: `Error deleting complaint: ${error.message}` });
  }
};