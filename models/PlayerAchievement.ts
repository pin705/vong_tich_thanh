import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export interface IPlayerAchievement {
  playerId: Schema.Types.ObjectId;
  achievementKey: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: Date;
}

export const PlayerAchievementSchema = defineMongooseModel<IPlayerAchievement>({
  name: 'PlayerAchievement',
  schema: {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    achievementKey: {
      type: String,
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  options: {
    timestamps: true,
  },
});

// Compound index for efficient queries
PlayerAchievementSchema.schema.index({ playerId: 1, achievementKey: 1 }, { unique: true });
