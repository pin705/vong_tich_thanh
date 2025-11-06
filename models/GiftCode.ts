import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const GiftCodeSchema = defineMongooseModel({
  name: 'GiftCode',
  schema: {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    rewards: {
      items: [{
        itemId: {
          type: Schema.Types.ObjectId,
          ref: 'Item',
        },
        quantity: {
          type: Number,
          default: 1,
        },
      }],
      gold: {
        type: Number,
        default: 0,
      },
      premium: {
        type: Number,
        default: 0,
      },
    },
    maxUses: {
      type: Number,
      default: 1,
    },
    redeemedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'Player',
    }],
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
});
