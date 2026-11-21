import Farm from '../models/Farm.js';

const createFarmNotFoundError = () => {
  const error = new Error('Farm not found or access denied');
  error.statusCode = 404;
  return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getStageQuery = (stage, now) => {
  const hasBothDates = {
    plantingDate: { $exists: true, $ne: null },
    harvestDate: { $exists: true, $ne: null },
  };

  switch (stage) {
    case 'planning':
      return {
        $or: [
          { plantingDate: { $exists: false } },
          { plantingDate: null },
          { harvestDate: { $exists: false } },
          { harvestDate: null },
        ],
      };
    case 'upcoming':
      return { ...hasBothDates, plantingDate: { $gt: now } };
    case 'growing':
      return {
        ...hasBothDates,
        plantingDate: { $lte: now },
        harvestDate: { $gte: now },
      };
    case 'harvested':
      return { ...hasBothDates, harvestDate: { $lt: now } };
    default:
      return null;
  }
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
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const stage = typeof req.query.filter === 'string' ? req.query.filter.toLowerCase() : 'all';
    const supportedStages = ['all', 'growing', 'planning', 'upcoming', 'harvested'];

    if (!supportedStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: 'Filter must be all, growing, planning, upcoming, or harvested',
      });
    }

    const query = { owner: req.user.id };
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { farmName: searchRegex },
        { location: searchRegex },
        { cropType: searchRegex },
      ];
    }

    const stageQuery = getStageQuery(stage, new Date());
    if (stageQuery) query.$and = [stageQuery];

    const farms = await Farm.find(query).sort({ createdAt: -1 });

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
