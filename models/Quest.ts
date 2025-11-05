import { defineMongooseModel } from '#nuxt/mongoose';
import type { Types } from 'mongoose';

export interface QuestReward {
  exp?: number;
  gold?: number;
  items?: Types.ObjectId[];
}

export interface QuestObjective {
  type: 'kill' | 'talk' | 'collect' | 'visit' | 'profession';
  target: string;
  count: number;
  progress: number;
}

export interface IQuest {
  _id: Types.ObjectId;
  name: string;
  description: string;
  type: 'main' | 'daily' | 'side';
  questGiver: string; // NPC name
  questGiverRoomId?: Types.ObjectId;
  objectives: QuestObjective[];
  rewards: QuestReward;
  levelRequirement: number;
  professionRequirement?: string;
  prerequisiteQuests?: Types.ObjectId[];
  isRepeatable: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const QuestSchema = defineMongooseModel<IQuest>({
  name: 'Quest',
  schema: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['main', 'daily', 'side'],
      default: 'side'
    },
    questGiver: { type: String, required: true },
    questGiverRoomId: { type: 'ObjectId', ref: 'Room' },
    objectives: [{
      type: {
        type: String,
        enum: ['kill', 'talk', 'collect', 'visit', 'profession'],
        required: true
      },
      target: { type: String, required: true },
      count: { type: Number, default: 1 },
      progress: { type: Number, default: 0 }
    }],
    rewards: {
      exp: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
      items: [{ type: 'ObjectId', ref: 'Item' }]
    },
    levelRequirement: { type: Number, default: 1 },
    professionRequirement: { type: String },
    prerequisiteQuests: [{ type: 'ObjectId', ref: 'Quest' }],
    isRepeatable: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  options: {
    timestamps: true
  }
});
