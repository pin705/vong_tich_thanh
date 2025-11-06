import { defineMongooseModel } from '#nuxt/mongoose';
import type { Types } from 'mongoose';

export interface IPlayerQuest {
  _id: Types.ObjectId;
  playerId: Types.ObjectId;
  questId: Types.ObjectId;
  status: 'active' | 'completed' | 'failed';
  objectives: {
    type: string;
    target: string;
    count: number;
    progress: number;
  }[];
  startedAt: Date;
  completedAt?: Date;
  lastDailyReset?: Date; // For daily quests
}

export const PlayerQuestSchema = defineMongooseModel<IPlayerQuest>({
  name: 'PlayerQuest',
  schema: {
    playerId: { type: 'ObjectId', ref: 'Player', required: true, index: true },
    questId: { type: 'ObjectId', ref: 'Quest', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active'
    },
    objectives: [{
      type: { type: String, required: true },
      target: { type: String, required: true },
      count: { type: Number, required: true },
      progress: { type: Number, default: 0 }
    }],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    lastDailyReset: { type: Date }
  },
  options: {
    timestamps: true
  }
});
