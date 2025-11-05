// Script to initialize the game world with rooms, NPCs, and items
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';

export async function initializeWorld() {
  try {
    console.log('Initializing game world...');

    // Check if world already exists
    const existingRooms = await RoomSchema.countDocuments();
    if (existingRooms > 0) {
      console.log('World already initialized, skipping...');
      return;
    }

    // Create items
    const binhMau = await ItemSchema.create({
      name: 'Bình Máu Nhỏ',
      description: 'Một bình thuốc nhỏ chứa dịch màu đỏ. Có thể hồi phục 15 HP.',
      type: 'consumable',
      value: 10,
      stats: { healing: 15 }
    });

    const kiemGi = await ItemSchema.create({
      name: 'Kiếm Gỉ',
      description: 'Một thanh kiếm cũ đã gỉ sét. Vẫn có thể dùng được nhưng không sắc lắm.',
      type: 'weapon',
      value: 25,
      stats: { damage: 8 }
    });

    const aoDa = await ItemSchema.create({
      name: 'Áo Da',
      description: 'Một bộ áo da đơn giản. Cung cấp một ít phòng thủ.',
      type: 'armor',
      value: 30,
      stats: { defense: 5 }
    });

    const duoiChuot = await ItemSchema.create({
      name: 'Đuôi Chuột',
      description: 'Đuôi của một con chuột biến dị. Có thể bán cho thương gia.',
      type: 'misc',
      value: 2
    });

    // Create rooms
    const cổngThành = await RoomSchema.create({
      name: 'Cổng Thành Cũ',
      description: 'Bạn đang đứng trước một cổng thành bằng đá đã sụp đổ một nửa. Rêu và dây leo phủ kín. Gió rít qua những khe hở. Về phía bắc, bạn thấy ánh đèn leo lét của khu chợ.',
      exits: {},
      items: [],
      agents: []
    });

    const khuCho = await RoomSchema.create({
      name: 'Khu Chợ',
      description: 'Một khu chợ nhỏ với vài gian hàng đang mở cửa. Mùi thức ăn và tiếng người qua lại tạo nên không khí sôi động.',
      exits: {},
      items: [],
      agents: []
    });

    const hẻmTối = await RoomSchema.create({
      name: 'Hẻm Tối',
      description: 'Một con hẻm tối tăm và hẹp. Bạn nghe thấy tiếng chuột chạy trong bóng tối. Có mùi hôi thối nồng nặc.',
      exits: {},
      items: [duoiChuot._id],
      agents: []
    });

    const quảngTrường = await RoomSchema.create({
      name: 'Quảng Trường',
      description: 'Quảng trường chính của thành phố. Một đài phun nước cũ kỹ đứng ở trung tâm, nước đã khô cạn từ lâu.',
      exits: {},
      items: [],
      agents: []
    });

    // Link rooms with exits
    cổngThành.exits.north = khuCho._id;
    khuCho.exits.south = cổngThành._id;
    khuCho.exits.east = hẻmTối._id;
    khuCho.exits.north = quảngTrường._id;
    hẻmTối.exits.west = khuCho._id;
    quảngTrường.exits.south = khuCho._id;

    await cổngThành.save();
    await khuCho.save();
    await hẻmTối.save();
    await quảngTrường.save();

    // Create NPCs
    const linhGac = await AgentSchema.create({
      name: 'Lính Gác',
      description: 'Người lính gác trông mệt mỏi. Áo giáp của anh ta đã rỉ sét và anh ta dựa vào một cây giáo cũ. Anh ta có vẻ không muốn bị làm phiền.',
      type: 'npc',
      currentRoomId: cổngThành._id,
      hp: 100,
      maxHp: 100,
      level: 5,
      damage: 10,
      behavior: 'passive',
      dialogue: [
        'Đừng gây rối. Nếu muốn tìm việc, đến khu chợ tìm [Thương Gia].',
        'Thành phố này đã không còn như xưa nữa...',
        'Cẩn thận khi đi vào hẻm. Có nhiều chuột biến dị ở đó.'
      ]
    });

    const thuongGia = await AgentSchema.create({
      name: 'Thương Gia',
      description: 'Một người đàn ông trung niên với nụ cười thân thiện. Anh ta đứng sau quầy hàng với nhiều vật phẩm.',
      type: 'npc',
      currentRoomId: khuCho._id,
      hp: 80,
      maxHp: 80,
      level: 3,
      damage: 5,
      behavior: 'passive',
      dialogue: [
        'Chào mừng! Gõ \'list\' để xem hàng của tôi. Tôi có đồ tốt đây!',
        'Nếu bạn tìm được Đuôi Chuột, tôi sẽ mua với giá tốt!',
        'Cẩn thận ngoài kia. Nhiều quái vật nguy hiểm lắm.'
      ],
      shopItems: [binhMau._id, kiemGi._id, aoDa._id]
    });

    const chuotBienDi = await AgentSchema.create({
      name: 'Chuột Biến Dị',
      description: 'Một con chuột to bằng con chó. Lông rụng, mắt đỏ rực, và răng nanh nhọn hoắt.',
      type: 'mob',
      currentRoomId: hẻmTối._id,
      hp: 30,
      maxHp: 30,
      level: 2,
      damage: 5,
      behavior: 'aggressive',
      loot: [duoiChuot._id],
      experience: 15
    });

    // Add agents to rooms
    cổngThành.agents.push(linhGac._id);
    khuCho.agents.push(thuongGia._id);
    hẻmTối.agents.push(chuotBienDi._id);

    await cổngThành.save();
    await khuCho.save();
    await hẻmTối.save();

    console.log('World initialized successfully!');
    console.log(`- Created ${await RoomSchema.countDocuments()} rooms`);
    console.log(`- Created ${await ItemSchema.countDocuments()} items`);
    console.log(`- Created ${await AgentSchema.countDocuments()} agents`);
    
    return {
      startingRoomId: cổngThành._id
    };
  } catch (error) {
    console.error('Error initializing world:', error);
    throw error;
  }
}
