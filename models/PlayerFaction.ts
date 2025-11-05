import { defineMongooseModel } from '#nuxt/mongoose';
import { Schema } from 'mongoose';

export const PlayerFactionSchema = defineMongooseModel({
  name: 'PlayerFaction',
  schema: {
    player: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    factionName: {
      type: String,
      required: true,
    },
    reputation: {
      type: Number,
      default: 0,
      // Reputation levels:
      // -3000 and below: Hated
      // -3000 to -500: Hostile
      // -500 to 0: Unfriendly
      // 0 to 500: Neutral
      // 500 to 3000: Friendly
      // 3000 to 6000: Honored
      // 6000 and above: Exalted
    },
  },
  options: {
    // Ensure one reputation record per player per faction
    indexes: [
      { fields: { player: 1, factionName: 1 }, options: { unique: true } }
    ]
  }
});
