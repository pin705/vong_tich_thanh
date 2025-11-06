import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const GuildSchema = defineMongooseModel({
  name: 'Guild',
  schema: {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    tag: {
      type: String,
      required: true,
      unique: true,
      maxlength: 5, // Short tag like [ABC]
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    officers: [{
      type: Schema.Types.ObjectId,
      ref: 'Player',
    }],
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'Player',
    }],
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
    bank: [{
      itemId: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
      },
      quantity: {
        type: Number,
        default: 1,
      },
    }],
    currency: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    announcements: [{
      message: String,
      author: {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
});
