import { body, param } from 'express-validator';

export const createFarmValidation = [
  body('farmName').trim().notEmpty().withMessage('Farm name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('farmSize').isFloat({ min: 0.1 }).withMessage('Farm size must be a positive number'),
  body('cropType').trim().notEmpty().withMessage('Crop type is required'),
  body('soilType').optional().trim(),
  body('plantingDate').optional().isISO8601().withMessage('Planting date must be a valid ISO date'),
  body('harvestDate').optional().isISO8601().withMessage('Harvest date must be a valid ISO date'),
];

export const updateFarmValidation = [
  param('id').isMongoId().withMessage('Invalid farm ID'),
  body('farmName').optional().trim().notEmpty().withMessage('Farm name cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('farmSize').optional().isFloat({ min: 0.1 }).withMessage('Farm size must be a positive number'),
  body('cropType').optional().trim().notEmpty().withMessage('Crop type cannot be empty'),
  body('soilType').optional().trim(),
  body('plantingDate').optional().isISO8601().withMessage('Planting date must be a valid ISO date'),
  body('harvestDate').optional().isISO8601().withMessage('Harvest date must be a valid ISO date'),
  body('owner').custom((value) => {
    if (value !== undefined) {
      throw new Error('Owner cannot be changed');
    }
    return true;
  }),
];

export const farmIdValidation = [
  param('id').isMongoId().withMessage('Invalid farm ID'),
];
