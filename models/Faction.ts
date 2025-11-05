import { defineMongooseModel } from '#nuxt/mongoose';

export const FactionSchema = defineMongooseModel({
  name: 'Faction',
  schema: {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Opposing factions - gaining reputation with one may decrease reputation with these
    opposingFactions: [{
      type: String, // Faction names
    }],
    // Allied factions - gaining reputation with one may increase reputation with these
    alliedFactions: [{
      type: String, // Faction names
    }],
  },
});
