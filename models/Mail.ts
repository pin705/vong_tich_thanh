import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const MailSchema = defineMongooseModel({
  name: 'Mail',
  schema: {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    senderName: {
      type: String,
      default: 'Hệ Thống',
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachedItems: [{
      itemId: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
      },
      quantity: {
        type: Number,
        default: 1,
      },
    }],
    attachedGold: {
      type: Number,
      default: 0,
    },
    attachedPremium: {
      type: Number,
      default: 0,
    },
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
