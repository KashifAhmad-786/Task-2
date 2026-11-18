import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
  {
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    farmSize: {
      type: Number,
      required: [true, 'Farm size is required'],
      min: [0.1, 'Farm size must be greater than 0'],
    },
    soilType: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    plantingDate: {
      type: Date,
    },
    harvestDate: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

const Farm = mongoose.model('Farm', farmSchema);

export default Farm;
