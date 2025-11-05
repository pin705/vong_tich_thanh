import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const BuffSchema = defineMongooseModel({
  name: 'Buff',
  schema: {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['EXP_BOOST', 'DAMAGE_BOOST', 'DEFENSE_BOOST', 'HEALING_BOOST'],
    },
    multiplier: {
      type: Number,
      required: true,
      default: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
});
