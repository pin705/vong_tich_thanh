// Sample achievements initialization script
// This file can be used to seed the database with sample achievements

export const SAMPLE_ACHIEVEMENTS = [
  // Combat achievements
  {
    achievementKey: 'kill_10_enemies',
    name: 'Tân Binh',
    description: 'Hạ gục 10 kẻ địch',
    category: 'COMBAT',
    criteria: {
      type: 'KILL_AGENT',
      key: '*', // Matches any agent
      amount: 10,
    },
    rewards: {
      exp: 100,
      gold: 50,
    },
  },
  {
    achievementKey: 'kill_50_enemies',
    name: 'Chiến Binh',
    description: 'Hạ gục 50 kẻ địch',
    category: 'COMBAT',
    criteria: {
      type: 'KILL_AGENT',
      key: '*',
      amount: 50,
    },
    rewards: {
      exp: 500,
      gold: 200,
      title: {
        key: 'warrior',
        name: '[Chiến Binh]',
        stats: {
          attack: 5,
          hp: 20,
        },
      },
    },
  },
  {
    achievementKey: 'kill_100_goblins',
    name: 'Kẻ Diệt Goblin',
    description: 'Hạ gục 100 Goblin',
    category: 'COMBAT',
    criteria: {
      type: 'KILL_AGENT',
      key: 'goblin', // Specific agent key
      amount: 100,
    },
    rewards: {
      exp: 1000,
      gold: 500,
      title: {
        key: 'goblin_slayer',
        name: '[Kẻ Diệt Goblin]',
        stats: {
          attack: 10,
          hp: 50,
          critChance: 5,
        },
      },
    },
  },
  
  // Exploration achievements
  {
    achievementKey: 'visit_10_rooms',
    name: 'Nhà Thám Hiểm Mới',
    description: 'Khám phá 10 phòng khác nhau',
    category: 'EXPLORATION',
    criteria: {
      type: 'VISIT_ROOM',
      key: '*',
      amount: 10,
    },
    rewards: {
      exp: 200,
      gold: 100,
    },
  },
  {
    achievementKey: 'visit_50_rooms',
    name: 'Nhà Thám Hiểm Kỳ Cựu',
    description: 'Khám phá 50 phòng khác nhau',
    category: 'EXPLORATION',
    criteria: {
      type: 'VISIT_ROOM',
      key: '*',
      amount: 50,
    },
    rewards: {
      exp: 1000,
      gold: 500,
      title: {
        key: 'explorer',
        name: '[Nhà Thám Hiểm]',
        stats: {
          hp: 100,
          dodge: 10,
        },
      },
    },
  },
  {
    achievementKey: 'visit_secret_cave',
    name: 'Phát Hiện Bí Mật',
    description: 'Khám phá Hang Động Bí Mật',
    category: 'EXPLORATION',
    criteria: {
      type: 'VISIT_ROOM',
      key: 'secret_cave', // Specific room key
      amount: 1,
    },
    rewards: {
      exp: 500,
      gold: 300,
    },
  },

  // Quest achievements
  {
    achievementKey: 'complete_5_quests',
    name: 'Người Hoàn Thành Nhiệm Vụ',
    description: 'Hoàn thành 5 nhiệm vụ',
    category: 'SOCIAL',
    criteria: {
      type: 'COMPLETE_QUEST',
      key: '*',
      amount: 5,
    },
    rewards: {
      exp: 300,
      gold: 150,
    },
  },
  {
    achievementKey: 'complete_20_quests',
    name: 'Anh Hùng Của Vùng Đất',
    description: 'Hoàn thành 20 nhiệm vụ',
    category: 'SOCIAL',
    criteria: {
      type: 'COMPLETE_QUEST',
      key: '*',
      amount: 20,
    },
    rewards: {
      exp: 2000,
      gold: 1000,
      title: {
        key: 'hero',
        name: '[Anh Hùng]',
        stats: {
          attack: 15,
          hp: 100,
          defense: 10,
        },
      },
    },
  },

  // Collection achievements
  {
    achievementKey: 'collect_10_items',
    name: 'Nhà Sưu Tập Nghiệp Dư',
    description: 'Nhặt 10 vật phẩm',
    category: 'COLLECTION',
    criteria: {
      type: 'GET_ITEM',
      key: '*',
      amount: 10,
    },
    rewards: {
      exp: 150,
      gold: 75,
    },
  },
  {
    achievementKey: 'collect_50_items',
    name: 'Nhà Sưu Tập Chuyên Nghiệp',
    description: 'Nhặt 50 vật phẩm',
    category: 'COLLECTION',
    criteria: {
      type: 'GET_ITEM',
      key: '*',
      amount: 50,
    },
    rewards: {
      exp: 800,
      gold: 400,
      title: {
        key: 'collector',
        name: '[Nhà Sưu Tập]',
        stats: {
          hp: 50,
          defense: 15,
          lifesteal: 5,
        },
      },
    },
  },
];

/**
 * Note: To use this in your database, you need to:
 * 1. Connect to MongoDB
 * 2. Import AchievementSchema
 * 3. Insert these achievements:
 * 
 * Example:
 * ```
 * import { AchievementSchema } from './models/Achievement';
 * import { SAMPLE_ACHIEVEMENTS } from './server/data/sampleAchievements';
 * 
 * async function initializeAchievements() {
 *   for (const achievement of SAMPLE_ACHIEVEMENTS) {
 *     await AchievementSchema.updateOne(
 *       { achievementKey: achievement.achievementKey },
 *       achievement,
 *       { upsert: true }
 *     );
 *   }
 * }
 * ```
 */
