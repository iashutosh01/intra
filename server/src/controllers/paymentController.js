import { addPayment, deletePayment, previewPayment, updatePayment } from '../services/paymentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const addPaymentController = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await addPayment(req.body) });
});

export const updatePaymentController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updatePayment(req.params.id, req.body) });
});

export const deletePaymentController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deletePayment(req.params.id) });
});

export const previewPaymentController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await previewPayment(req.query) });
});
