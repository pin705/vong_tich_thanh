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

    const binhMauLon = await ItemSchema.create({
      name: 'Bình Máu Lớn',
      description: 'Một bình thuốc lớn chứa dịch màu đỏ tươi. Có thể hồi phục 30 HP.',
      type: 'consumable',
      value: 25,
      stats: { healing: 30 }
    });

    const kiemThep = await ItemSchema.create({
      name: 'Kiếm Thép',
      description: 'Một thanh kiếm thép sắc bén. Vẫn còn mới và có thể gây sát thương tốt.',
      type: 'weapon',
      value: 50,
      stats: { damage: 15 }
    });

    const aoGiapNhe = await ItemSchema.create({
      name: 'Áo Giáp Nhẹ',
      description: 'Một bộ giáp nhẹ làm từ thép và da. Cung cấp phòng thủ tốt mà không làm chậm chuyển động.',
      type: 'armor',
      value: 60,
      stats: { defense: 10 }
    });

    const chiKhoaVang = await ItemSchema.create({
      name: 'Chìa Khóa Vàng',
      description: 'Một chiếc chìa khóa bằng vàng với hoa văn phức tạp. Có vẻ quan trọng.',
      type: 'misc',
      value: 100
    });

    // Premium Shop Items
    const theExpX2 = await ItemSchema.create({
      name: 'Thẻ x2 EXP (1 Giờ)',
      description: 'Một tấm thẻ phát sáng ánh xanh lục. Khi sử dụng, bạn sẽ nhận được gấp đôi kinh nghiệm trong 1 giờ.',
      type: 'consumable',
      value: 0,
      premiumPrice: 50,
      effects: {
        buff: 'EXP_BOOST',
        multiplier: 2,
        duration_minutes: 60
      }
    });

    const theExpX3 = await ItemSchema.create({
      name: 'Thẻ x3 EXP (30 Phút)',
      description: 'Một tấm thẻ phát sáng ánh vàng rực rỡ. Khi sử dụng, bạn sẽ nhận được gấp ba kinh nghiệm trong 30 phút.',
      type: 'consumable',
      value: 0,
      premiumPrice: 80,
      effects: {
        buff: 'EXP_BOOST',
        multiplier: 3,
        duration_minutes: 30
      }
    });

    // Phase 21: Crafting Materials
    const daChuot = await ItemSchema.create({
      name: 'Da Chuột',
      description: 'Da của chuột biến dị, có thể dùng để chế tạo trang bị nhẹ.',
      type: 'Material',
      value: 2,
      quality: 'Thường'
    });

    const vaiRach = await ItemSchema.create({
      name: 'Vải Rách',
      description: 'Mảnh vải cũ kỹ, vẫn có thể dùng để may vá.',
      type: 'Material',
      value: 1,
      quality: 'Thường'
    });

    const loiCoNguHong = await ItemSchema.create({
      name: 'Lõi Cổ Ngữ Hỏng',
      description: 'Lõi năng lượng cổ đại đã hư hỏng, vẫn phát ra ánh sáng yếu ớt.',
      type: 'Material',
      value: 50,
      quality: 'Hiếm',
      rarity: 'rare'
    });

    const loiHoVeCoDai = await ItemSchema.create({
      name: 'Lõi Hộ Vệ Cổ Đại',
      description: 'Lõi năng lượng từ hộ vệ cổ đại, phát ra ánh sáng mạnh mẽ và ổn định.',
      type: 'Material',
      value: 200,
      quality: 'Sử Thi',
      rarity: 'legendary'
    });

    // Phase 21: Equipment Set - "Set Lãng Khách" (Level 10)
    const muLangKhach = await ItemSchema.create({
      name: 'Mũ Lãng Khách',
      description: 'Mũ da nhẹ của những kẻ lang thang. Tăng sự nhanh nhẹn.',
      type: 'Equipment',
      slot: 'helmet',
      value: 30,
      quality: 'Thường',
      requiredLevel: 8,
      setKey: 'set_lang_khach_cap_10',
      stats: {
        agility: 2
      }
    });

    const aoLangKhach = await ItemSchema.create({
      name: 'Áo Lãng Khách',
      description: 'Áo da bảo vệ thân thể. Nhẹ nhàng nhưng bền bỉ.',
      type: 'Equipment',
      slot: 'chest',
      value: 50,
      quality: 'Thường',
      requiredLevel: 10,
      setKey: 'set_lang_khach_cap_10',
      stats: {
        agility: 3
      },
      setBonus: [
        {
          requiredPieces: 2,
          stats: new Map([['hp', 50]])
        },
        {
          requiredPieces: 4,
          stats: new Map([['agility', 10], ['hp', 100]])
        }
      ]
    });

    const quanLangKhach = await ItemSchema.create({
      name: 'Quần Lãng Khách',
      description: 'Quần da dẻo dai, thích hợp cho hành trình dài.',
      type: 'Equipment',
      slot: 'legs',
      value: 40,
      quality: 'Thường',
      requiredLevel: 9,
      setKey: 'set_lang_khach_cap_10',
      stats: {
        agility: 2,
        hp: 20
      }
    });

    const giayLangKhach = await ItemSchema.create({
      name: 'Giày Lãng Khách',
      description: 'Giày da mềm, giúp di chuyển êm ái và nhanh nhẹn.',
      type: 'Equipment',
      slot: 'boots',
      value: 35,
      quality: 'Thường',
      requiredLevel: 8,
      setKey: 'set_lang_khach_cap_10',
      stats: {
        agility: 2
      }
    });

    // Phase 21: Crafting Recipes
    const congThucMuLangKhach = await ItemSchema.create({
      name: 'Công Thức: Mũ Lãng Khách',
      description: 'Bản vẽ chi tiết cách chế tạo Mũ Lãng Khách.',
      type: 'Recipe',
      value: 20,
      quality: 'Thường',
      resultItem: muLangKhach._id,
      recipe: [
        { materialId: daChuot._id, quantity: 5 },
        { materialId: vaiRach._id, quantity: 3 }
      ]
    });

    const congThucMuSuThi = await ItemSchema.create({
      name: 'Công Thức: Mũ Sử Thi',
      description: 'Bản vẽ cổ xưa hướng dẫn chế tạo trang bị huyền thoại.',
      type: 'Recipe',
      value: 500,
      quality: 'Sử Thi',
      rarity: 'legendary',
      recipe: [
        { materialId: daChuot._id, quantity: 50 },
        { materialId: loiHoVeCoDai._id, quantity: 1 }
      ]
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

    const rừngRậm = await RoomSchema.create({
      name: 'Rừng Rậm',
      description: 'Một khu rừng rậm bên ngoài thành phố. Cây cối um tùm, ánh sáng mờ ảo. Bạn nghe thấy tiếng động vật hoang dã.',
      exits: {},
      items: [],
      agents: []
    });

    const hang = await RoomSchema.create({
      name: 'Hang Tối',
      description: 'Một hang động tối tăm và ẩm ướt. Bạn cảm thấy có điều gì đó nguy hiểm đang rình rập trong bóng tối.',
      exits: {},
      items: [chiKhoaVang._id],
      agents: []
    });

    const thápCổ = await RoomSchema.create({
      name: 'Tháp Cổ',
      description: 'Một tòa tháp cổ cao ngất. Cầu thang xoắn ốc dẫn lên trên. Tường đá phủ đầy bụi và rêu.',
      exits: {},
      items: [],
      agents: []
    });

    const phòngKhóTreasure = await RoomSchema.create({
      name: 'Phòng Kho Báu',
      description: 'Một phòng nhỏ với nhiều rương gỗ. Không khí tĩnh lặng đến đáng ngờ. Có vẻ như ai đó đã ở đây trước bạn.',
      exits: {},
      items: [binhMauLon._id, kiemThep._id],
      agents: []
    });

    const hànhLang = await RoomSchema.create({
      name: 'Hành Lang Dài',
      description: 'Một hành lang dài và hẹp. Đèn dầu trên tường còn cháy yếu ớt. Có nhiều cửa phòng ở hai bên.',
      exits: {},
      items: [],
      agents: []
    });

    const sânLuyệnTập = await RoomSchema.create({
      name: 'Sân Luyện Tập',
      description: 'Một sân tập rộng với nhiều mục tiêu và vũ khí tập luyện. Có vẻ như vẫn còn được sử dụng thường xuyên.',
      exits: {},
      items: [],
      agents: []
    });

    // Link rooms with exits - create a connected world
    cổngThành.exits.north = khuCho._id;
    cổngThành.exits.east = rừngRậm._id;
    
    khuCho.exits.south = cổngThành._id;
    khuCho.exits.east = hẻmTối._id;
    khuCho.exits.north = quảngTrường._id;
    khuCho.exits.west = sânLuyệnTập._id;
    
    hẻmTối.exits.west = khuCho._id;
    
    quảngTrường.exits.south = khuCho._id;
    quảngTrường.exits.north = thápCổ._id;
    
    rừngRậm.exits.west = cổngThành._id;
    rừngRậm.exits.north = hang._id;
    
    hang.exits.south = rừngRậm._id;
    
    thápCổ.exits.south = quảngTrường._id;
    thápCổ.exits.up = hànhLang._id;
    
    hànhLang.exits.down = thápCổ._id;
    hànhLang.exits.north = phòngKhóTreasure._id;
    
    phòngKhóTreasure.exits.south = hànhLang._id;
    
    sânLuyệnTập.exits.east = khuCho._id;

    await cổngThành.save();
    await khuCho.save();
    await hẻmTối.save();
    await quảngTrường.save();
    await rừngRậm.save();
    await hang.save();
    await thápCổ.save();
    await hànhLang.save();
    await phòngKhóTreasure.save();
    await sânLuyệnTập.save();

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
      experience: 15,
      lootTable: [
        { itemId: daChuot._id, dropChance: 0.5 }, // 50% chance
        { itemId: vaiRach._id, dropChance: 0.3 }  // 30% chance
      ]
    });

    const sóiRừng = await AgentSchema.create({
      name: 'Sói Rừng',
      description: 'Một con sói hoang dã với bộ lông xám và đôi mắt vàng sắc bén. Nó gầm gừ đe dọa.',
      type: 'mob',
      currentRoomId: rừngRậm._id,
      hp: 40,
      maxHp: 40,
      level: 3,
      damage: 8,
      behavior: 'wander',
      loot: [],
      experience: 20,
      lootTable: [
        { itemId: daChuot._id, dropChance: 0.4 },
        { itemId: vaiRach._id, dropChance: 0.4 }
      ]
    });

    const goblin = await AgentSchema.create({
      name: 'Goblin',
      description: 'Một con goblin nhỏ nhưng hung hãn. Da xanh, tai nhọn, và cầm một cây gậy gỗ thô sơ.',
      type: 'mob',
      currentRoomId: hang._id,
      hp: 50,
      maxHp: 50,
      level: 4,
      damage: 10,
      behavior: 'aggressive',
      loot: [binhMau._id],
      experience: 30,
      lootTable: [
        { itemId: daChuot._id, dropChance: 0.6 },
        { itemId: vaiRach._id, dropChance: 0.5 },
        { itemId: loiCoNguHong._id, dropChance: 0.1 } // 10% chance for rare
      ]
    });

    const linhTuần = await AgentSchema.create({
      name: 'Lính Tuần',
      description: 'Một người lính đang tuần tra. Anh ta mặc áo giáp nhẹ và cầm một cây giáo.',
      type: 'npc',
      currentRoomId: quảngTrường._id,
      hp: 80,
      maxHp: 80,
      level: 5,
      damage: 12,
      behavior: 'patrol',
      patrolRoute: [quảngTrường._id, thápCổ._id, hànhLang._id, thápCổ._id],
      dialogue: [
        'Mọi thứ đều yên ổn ở đây.',
        'Đừng gây rối trong khu vực này.',
        'Tôi đang làm nhiệm vụ.'
      ],
      experience: 0
    });

    const huấnLuyệnViên = await AgentSchema.create({
      name: 'Huấn Luyện Viên',
      description: 'Một chiến binh kỳ cựu với nhiều vết sẹo. Anh ta đang giảng dạy các chiến binh trẻ.',
      type: 'npc',
      currentRoomId: sânLuyệnTập._id,
      hp: 100,
      maxHp: 100,
      level: 7,
      damage: 15,
      behavior: 'passive',
      dialogue: [
        'Muốn trở thành mạnh mẽ? Hãy luyện tập chăm chỉ!',
        'Chiến đấu không chỉ là sức mạnh, mà còn là kỹ thuật.',
        'Tôi đã chiến đấu trong nhiều trận chiến lớn.'
      ],
      experience: 0
    });

    const phùThủy = await AgentSchema.create({
      name: 'Phù Thủy',
      description: 'Một phù thủy già với chiếc áo choàng tím. Ông ta đang nghiên cứu một cuốn sách cũ.',
      type: 'npc',
      currentRoomId: phòngKhóTreasure._id,
      hp: 60,
      maxHp: 60,
      level: 6,
      damage: 20,
      behavior: 'passive',
      dialogue: [
        'Ma thuật là chìa khóa của sức mạnh thực sự.',
        'Tôi đang tìm kiếm một cuốn sách bị mất.',
        'Hãy cẩn thận với những gì bạn không hiểu.'
      ],
      shopItems: [binhMauLon._id, aoGiapNhe._id],
      experience: 0
    });

    const thuongGiaBiAn = await AgentSchema.create({
      name: 'Thương Gia Bí Ẩn',
      description: 'Một người mặc áo choàng đen bí ẩn. Ánh mắt sắc bén nhìn thấu mọi thứ. Một hào quang kỳ lạ bao quanh người này.',
      type: 'npc',
      currentRoomId: khuCho._id,
      hp: 100,
      maxHp: 100,
      level: 10,
      damage: 25,
      behavior: 'passive',
      dialogue: [
        'Chào mừng đến với Cửa Hàng Cao Cấp. Tôi bán những vật phẩm đặc biệt...',
        'Cổ Thạch là đồng tiền quý giá. Sử dụng khôn ngoan.',
        'Những vật phẩm của tôi có thể thay đổi vận mệnh của bạn.'
      ],
      shopItems: [theExpX2._id, theExpX3._id],
      experience: 0
    });

    // Add agents to rooms
    cổngThành.agents.push(linhGac._id);
    khuCho.agents.push(thuongGia._id);
    khuCho.agents.push(thuongGiaBiAn._id);
    hẻmTối.agents.push(chuotBienDi._id);
    rừngRậm.agents.push(sóiRừng._id);
    hang.agents.push(goblin._id);
    quảngTrường.agents.push(linhTuần._id);
    sânLuyệnTập.agents.push(huấnLuyệnViên._id);
    phòngKhóTreasure.agents.push(phùThủy._id);

    await cổngThành.save();
    await khuCho.save();
    await hẻmTối.save();
    await rừngRậm.save();
    await hang.save();
    await quảngTrường.save();
    await sânLuyệnTập.save();
    await phòngKhóTreasure.save();

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
