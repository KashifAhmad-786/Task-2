import Farm from '../models/Farm.js';

const createFarmNotFoundError = () => {
  const error = new Error('Farm not found or access denied');
  error.statusCode = 404;
  return error;
};

export const createFarm = async (req, res, next) => {
  try {
    const { owner, ...farmData } = req.body;

    const farm = await Farm.create({
      ...farmData,
      owner: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      farm,
    });
  } catch (error) {
    return next(error);
  }
};

export const getFarms = async (req, res, next) => {
  try {
    const farms = await Farm.find({ owner: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: farms.length,
      farms,
    });
  } catch (error) {
    return next(error);
  }
};

export const getFarmById = async (req, res, next) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!farm) {
      return next(createFarmNotFoundError());
    }

    return res.status(200).json({
      success: true,
      farm,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!farm) {
      return next(createFarmNotFoundError());
    }

    const nextData = { ...req.body };
    delete nextData.owner;

    Object.assign(farm, nextData);
    await farm.save();

    return res.status(200).json({
      success: true,
      message: 'Farm updated successfully',
      farm,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!farm) {
      return next(createFarmNotFoundError());
    }

    await farm.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Farm deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};
