import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const AuctionItemSchema = defineMongooseModel({
  name: 'AuctionItem',
  schema: {
    item: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    currentBidder: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    buyoutPrice: {
      type: Number,
      default: null, // Optional instant buy price
    },
    duration: {
      type: Number,
      default: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'expired', 'cancelled'],
      default: 'active',
    },
    bidHistory: [{
      bidder: {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
      amount: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
});
