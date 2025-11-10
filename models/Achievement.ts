import { defineMongooseModel } from '#nuxt/mongoose';
import { GameStats, STATS_SCHEMA_DEFINITION } from '~/types/gameTypes';

export interface AchievementCriteria {
  type: 'KILL_AGENT' | 'VISIT_ROOM' | 'COMPLETE_QUEST' | 'GET_ITEM';
  key: string; // agentKey, roomKey, questKey, or itemKey
  amount: number;
}

export interface TitleReward {
  key: string;
  name: string;
  stats: GameStats;
}

export interface AchievementRewards {
  exp?: number;
  gold?: number;
  title?: TitleReward;
}

export interface IAchievement {
  achievementKey: string;
  name: string;
  description: string;
  category: 'COMBAT' | 'EXPLORATION' | 'SOCIAL' | 'COLLECTION';
  criteria: AchievementCriteria;
  rewards: AchievementRewards;
}

export const AchievementSchema = defineMongooseModel<IAchievement>({
  name: 'Achievement',
  schema: {
    achievementKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['COMBAT', 'EXPLORATION', 'SOCIAL', 'COLLECTION'],
      required: true,
    },
    criteria: {
      type: {
        type: String,
        enum: ['KILL_AGENT', 'VISIT_ROOM', 'COMPLETE_QUEST', 'GET_ITEM'],
        required: true,
      },
      key: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        default: 1,
      },
    },
    rewards: {
      exp: { type: Number },
      gold: { type: Number },
      title: {
        key: { type: String },
        name: { type: String },
        stats: STATS_SCHEMA_DEFINITION,
      },
    },
  },
});
