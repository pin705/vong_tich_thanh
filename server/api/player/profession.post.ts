import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';

const professionStarterItems: Record<string, Array<{ name: string, type: string, description: string, value: number, stats?: any }>> = {
  blacksmith: [
    { name: 'Búa rèn bạc', type: 'weapon', description: 'Búa rèn chất lượng cao', value: 30, stats: { damage: 8 } },
    { name: 'Găng tay da', type: 'armor', description: 'Găng tay bảo vệ tay', value: 15, stats: { defense: 3 } }
  ],
  alchemist: [
    { name: 'Bộ dụng cụ giả kim', type: 'misc', description: 'Dụng cụ pha chế cơ bản', value: 25 },
    { name: 'Bình máu trung', type: 'consumable', description: 'Hồi 30 HP', value: 20, stats: { healing: 30 } }
  ],
  enchanter: [
    { name: 'Gậy phép sư', type: 'weapon', description: 'Gậy tăng sức mạnh phép thuật', value: 35, stats: { damage: 6 } },
    { name: 'Đá mana', type: 'misc', description: 'Đá chứa năng lượng ma thuật', value: 20 }
  ],
  hunter: [
    { name: 'Dao săn', type: 'weapon', description: 'Dao sắc bén dùng để săn bắt', value: 28, stats: { damage: 9 } },
    { name: 'Túi da lớn', type: 'misc', description: 'Túi đựng chiến lợi phẩm', value: 15 }
  ],
  miner: [
    { name: 'Cuốc mỏ thép', type: 'weapon', description: 'Cuốc khai thác khoáng sản', value: 25, stats: { damage: 7 } },
    { name: 'Mũ mỏ', type: 'armor', description: 'Mũ bảo vệ đầu', value: 18, stats: { defense: 4 } }
  ],
  herbalist: [
    { name: 'Liềm thu hoạch', type: 'weapon', description: 'Liềm thu thập thảo mộc', value: 22, stats: { damage: 5 } },
    { name: 'Túi thảo mộc', type: 'misc', description: 'Túi đựng thảo mộc', value: 12 }
  ]
};

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const body = await readBody(event);
    const { profession } = body;

    if (!profession) {
      return { success: false, message: 'Profession is required' };
    }

    const validProfessions = ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist'];
    if (!validProfessions.includes(profession)) {
      return { success: false, message: 'Invalid profession' };
    }

    const playerId = session.user.id;

    // Check if player already has a profession
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (player.profession) {
      return { success: false, message: 'Bạn đã có nghề nghiệp rồi!' };
    }

    // Set profession
    player.profession = profession;
    player.professionLevel = 1;
    player.professionExp = 0;

    // Give starter items
    const starterItems = professionStarterItems[profession] || [];
    for (const itemData of starterItems) {
      const item = await ItemSchema.create({
        name: itemData.name,
        description: itemData.description,
        type: itemData.type,
        value: itemData.value,
        stats: itemData.stats || {}
      });
      player.inventory.push(item._id);
    }

    await player.save();

    return {
      success: true,
      message: `Đã chọn nghề nghiệp: ${profession}`,
      profession: player.profession,
      professionLevel: player.professionLevel
    };
  } catch (error) {
    console.error('Error choosing profession:', error);
    return { 
      success: false, 
      message: 'Failed to choose profession'
    };
  }
});
