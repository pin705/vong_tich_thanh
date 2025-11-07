// Script to initialize the game world with rooms, NPCs, and items
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { ItemSchema } from '../../models/Item';
import { AgentSchema } from '../../models/Agent';
import { QuestSchema } from '../../models/Quest';
import { PetTemplateSchema } from '../../models/PetTemplate';

export async function initializeWorld() {
  try {
    console.log('Initializing game world...');

    // await RoomSchema.deleteMany({});
    // await ItemSchema.deleteMany({});
    // await AgentSchema.deleteMany({});
    // await QuestSchema.deleteMany({});

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
      price: 50,
      sellValue: 10,
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
      price: 100,
      sellValue: 25,
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

    // Phase 26: Additional Consumables
    const binhMauVua = await ItemSchema.create({
      name: 'Bình Máu Vừa',
      description: 'Một bình thuốc cỡ vừa chứa dịch màu đỏ thẫm. Có thể hồi phục 500 HP.',
      type: 'consumable',
      value: 50,
      price: 250,
      sellValue: 50,
      stats: { healing: 500 }
    });

    const binhNangLuongNho = await ItemSchema.create({
      name: 'Bình Năng Lượng Nhỏ',
      description: 'Một lọ dịch màu xanh lam phát sáng. Hồi phục 100 Năng Lượng (Mana/Nộ/Energy).',
      type: 'consumable',
      value: 20,
      price: 100,
      sellValue: 20,
      effects: {
        restoreResource: 100
      }
    });

    const dichChuyenVeChoCu = await ItemSchema.create({
      name: 'Dịch Chuyển Về Chợ Cũ',
      description: 'Một cuộn giấy cổ với ký tự phát sáng. Sử dụng một lần để quay về Chợ Cũ.',
      type: 'consumable',
      value: 40,
      price: 200,
      sellValue: 0,
      effects: {
        teleport: 'khu_cho_cu'
      }
    });

    // Phase 26: Utility Items
    const chiaKhoaHamNgam = await ItemSchema.create({
      name: 'Chìa Khóa Hầm Ngầm',
      description: 'Một chiếc chìa khóa gỉ sét với hình dạng kỳ lạ. Có vẻ mở được cánh cửa xuống Hầm Ngầm.',
      type: 'misc',
      value: 0,
      sellValue: 0,
      quality: 'Tốt'
    });

    const ruongGoNho = await ItemSchema.create({
      name: 'Rương Gỗ Nhỏ',
      description: 'Một chiếc rương gỗ nhỏ cũ kỹ. Bên trong có thể chứa vật phẩm ngẫu nhiên.',
      type: 'misc',
      value: 10,
      sellValue: 5,
      effects: {
        container: true,
        randomLoot: true
      }
    });

    // Enhancement System: Upgrade Materials
    const daCuongHoaCap1 = await ItemSchema.create({
      name: 'Đá Cường Hóa Cấp 1',
      description: 'Một viên đá phát sáng màu xanh lục. Dùng để cường hóa trang bị lên cấp cao hơn.',
      type: 'upgrade_material',
      upgradeType: 'enhancement',
      itemKey: 'enhance_stone_1',
      value: 50,
      price: 100,
      sellValue: 25,
      quality: 'Thường'
    });

    const daNangSaoSoCap = await ItemSchema.create({
      name: 'Đá Nâng Sao Sơ Cấp',
      description: 'Một viên đá lấp lánh ánh sáng như sao. Có thể tăng số sao của trang bị.',
      type: 'upgrade_material',
      upgradeType: 'star',
      itemKey: 'star_stone_1',
      value: 100,
      price: 200,
      sellValue: 50,
      quality: 'Tốt'
    });

    const daTinhLuyen = await ItemSchema.create({
      name: 'Đá Tinh Luyện',
      description: 'Một viên đá tinh khiết phát sáng ánh tím. Dùng để tinh luyện và cải thiện trang bị.',
      type: 'upgrade_material',
      upgradeType: 'refine',
      itemKey: 'refine_stone_1',
      value: 75,
      price: 150,
      sellValue: 35,
      quality: 'Tốt'
    });

    // Dungeon Shop - Special items only available for dungeon coins
    const kiemHamNguc = await ItemSchema.create({
      name: 'Kiếm Hầm Ngục',
      description: 'Một thanh kiếm rèn từ kim loại hiếm trong hầm ngục. Phát sáng ánh tím huyền bí.',
      type: 'weapon',
      slot: 'weapon',
      value: 0, // Cannot be sold for gold
      stats: { damage: 50 },
      quality: 'Sử Thi',
      requiredLevel: 20
    });

    const aoGiapHamNguc = await ItemSchema.create({
      name: 'Áo Giáp Hầm Ngục',
      description: 'Bộ giáp nặng được tạo từ vật liệu quý hiếm. Cung cấp phòng thủ tuyệt vời.',
      type: 'armor',
      slot: 'chest',
      value: 0, // Cannot be sold for gold
      stats: { defense: 40 },
      quality: 'Sử Thi',
      requiredLevel: 20
    });

    // Pet System Items
    const trungSoi = await ItemSchema.create({
      name: 'Trứng Sói',
      description: 'Một quả trứng lớn với vỏ cứng màu xám bạc. Có vẻ chứa một sinh vật mạnh mẽ bên trong.',
      type: 'PET_EGG',
      itemKey: 'egg_wolf',
      value: 0,
      price: 500,
      sellValue: 0,
      data: { grantsPetKey: 'wolf' }
    });

    const thucAnPetSoCap = await ItemSchema.create({
      name: 'Thức Ăn Pet Sơ Cấp',
      description: 'Một túi thức ăn dinh dưỡng dành cho thú cưng. Cung cấp 50 điểm kinh nghiệm.',
      type: 'PET_FOOD',
      itemKey: 'pet_food_1',
      value: 10,
      price: 50,
      sellValue: 10,
      data: { expValue: 50 }
    });

    const thucAnPetCaoCap = await ItemSchema.create({
      name: 'Thức Ăn Pet Cao Cấp',
      description: 'Một túi thức ăn cao cấp dành cho thú cưng. Cung cấp 200 điểm kinh nghiệm.',
      type: 'PET_FOOD',
      itemKey: 'pet_food_2',
      value: 50,
      price: 250,
      sellValue: 50,
      data: { expValue: 200 }
    });

    const daTayTuyPet = await ItemSchema.create({
      name: 'Đá Tẩy Tủy Pet',
      description: 'Một viên đá quý hiếm phát sáng ánh vàng. Có thể dùng để thay đổi phẩm chất của thú cưng.',
      type: 'PET_UPGRADE',
      itemKey: 'pet_reroll_stone',
      value: 0,
      price: 0,
      sellValue: 0
    });

    const sachKyNangPetCanXe = await ItemSchema.create({
      name: 'Sách Kỹ Năng Pet: Cắn Xé',
      description: 'Một cuốn sách cũ kỹ chứa kỹ thuật huấn luyện. Dạy thú cưng kỹ năng Cắn Xé.',
      type: 'PET_SKILLBOOK',
      itemKey: 'pet_skillbook_bite',
      value: 0,
      price: 300,
      sellValue: 0,
      data: { skillKey: 'bite' }
    });

    const theDoiTenPet = await ItemSchema.create({
      name: 'Thẻ Đổi Tên Pet',
      description: 'Một tấm thẻ đặc biệt cho phép bạn đổi tên thú cưng của mình.',
      type: 'PET_CONSUMABLE',
      itemKey: 'pet_rename_tag',
      value: 0,
      price: 100,
      sellValue: 0
    });

    const binhMauPetNho = await ItemSchema.create({
      name: 'Bình Máu Pet Nhỏ',
      description: 'Một bình thuốc chuyên dụng cho thú cưng. Hồi phục 100 HP cho pet.',
      type: 'PET_CONSUMABLE',
      itemKey: 'pet_heal_potion_1',
      value: 15,
      price: 75,
      sellValue: 15,
      data: { healAmount: 100 }
    });

    const thuocCuongHoaPet = await ItemSchema.create({
      name: 'Thuốc Cường Hóa Pet',
      description: 'Một lọ thuốc màu đỏ tươi. Tăng sát thương của pet trong 30 giây.',
      type: 'PET_CONSUMABLE',
      itemKey: 'pet_strength_potion_1',
      value: 25,
      price: 125,
      sellValue: 25,
      data: { buffKey: 'PET_ATTACK_BUFF', duration: 30000 }
    });

    // Pet Trial System: Premium Pet Items (Tamer Badge Shop)
    const trungPhuongHoang = await ItemSchema.create({
      name: 'Trứng Phượng Hoàng',
      description: 'Một quả trứng huyền thoại phát sáng ánh vàng rực rỡ. Bên trong là sinh vật huyền thoại Phượng Hoàng.',
      type: 'PET_EGG',
      itemKey: 'egg_phoenix',
      value: 0,
      price: 0,
      sellValue: 0,
      quality: 'Sử Thi',
      rarity: 'legendary',
      data: { grantsPetKey: 'phoenix' }
    });

    const thucAnPetSieuCap = await ItemSchema.create({
      name: 'Thức Ăn Pet Siêu Cấp',
      description: 'Thức ăn đặc biệt được chế biến từ nguyên liệu quý hiếm. Cung cấp 1000 điểm kinh nghiệm cho thú cưng.',
      type: 'PET_FOOD',
      itemKey: 'pet_food_3',
      value: 0,
      price: 0,
      sellValue: 0,
      quality: 'Hiếm',
      data: { expValue: 1000 }
    });

    const sachKyNangPetPhunLua = await ItemSchema.create({
      name: 'Sách Kỹ Năng Pet: Phun Lửa',
      description: 'Một cuốn sách quý hiếm dạy thú cưng kỹ năng Phun Lửa mạnh mẽ.',
      type: 'PET_SKILLBOOK',
      itemKey: 'pet_skillbook_fire_breath',
      value: 0,
      price: 0,
      sellValue: 0,
      quality: 'Hiếm',
      rarity: 'rare',
      data: { skillKey: 'fire_breath' }
    });

    const sachKyNangPetTanCong = await ItemSchema.create({
      name: 'Sách Kỹ Năng Pet: Tấn Công Liên Hoàn',
      description: 'Cuốn sách dạy thú cưng kỹ năng tấn công nhiều lần liên tiếp.',
      type: 'PET_SKILLBOOK',
      itemKey: 'pet_skillbook_multi_attack',
      value: 0,
      price: 0,
      sellValue: 0,
      quality: 'Tốt',
      data: { skillKey: 'multi_attack' }
    });

    const binhMauPetLon = await ItemSchema.create({
      name: 'Bình Máu Pet Lớn',
      description: 'Một bình thuốc lớn chuyên dụng cho thú cưng. Hồi phục 500 HP cho pet.',
      type: 'PET_CONSUMABLE',
      itemKey: 'pet_heal_potion_2',
      value: 0,
      price: 0,
      sellValue: 0,
      data: { healAmount: 500 }
    });

    const thuocPhongThuPet = await ItemSchema.create({
      name: 'Thuốc Phòng Thủ Pet',
      description: 'Một lọ thuốc màu xanh lục. Tăng phòng thủ của pet trong 30 giây.',
      type: 'PET_CONSUMABLE',
      itemKey: 'pet_defense_potion_1',
      value: 0,
      price: 0,
      sellValue: 0,
      data: { buffKey: 'PET_DEFENSE_BUFF', duration: 30000 }
    });

    // Phase 21 & 22: Crafting Materials
    // Zone 1 Materials (Level 1-10)
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

    // Zone 2 Materials (Level 10-20)
    const voNhenCung = await ItemSchema.create({
      name: 'Vỏ Nhện Cứng',
      description: 'Vỏ cứng của nhện đột biến, có thể dùng làm giáp nhẹ.',
      type: 'Material',
      value: 5,
      quality: 'Thường'
    });

    const loiNangLuongYeu = await ItemSchema.create({
      name: 'Lõi Năng Lượng Yếu',
      description: 'Lõi năng lượng nhỏ từ các thiết bị cổ, còn một chút năng lượng.',
      type: 'Material',
      value: 8,
      quality: 'Tốt'
    });

    const loiCoNguHong = await ItemSchema.create({
      name: 'Lõi Cổ Ngữ Hỏng',
      description: 'Lõi năng lượng cổ đại đã hư hỏng, vẫn phát ra ánh sáng yếu ớt.',
      type: 'Material',
      value: 50,
      quality: 'Hiếm',
      rarity: 'rare'
    });

    // Zone 3 Materials (Level 20-30)
    const banhRangRiSet = await ItemSchema.create({
      name: 'Bánh Răng Rỉ Sét',
      description: 'Bánh răng kim loại bị rỉ sét, vẫn có thể tái sử dụng.',
      type: 'Material',
      value: 12,
      quality: 'Tốt'
    });

    const moDotBienNho = await ItemSchema.create({
      name: 'Mô Đột Biến Nhỏ',
      description: 'Mô sinh học bị đột biến, có thể dùng cho nghiên cứu hoặc chế tạo.',
      type: 'Material',
      value: 15,
      quality: 'Tốt'
    });

    const chipViMachCo = await ItemSchema.create({
      name: 'Chip Vi Mạch Cổ',
      description: 'Vi mạch điện tử cổ đại, còn hoạt động được.',
      type: 'Material',
      value: 80,
      quality: 'Hiếm',
      rarity: 'rare'
    });

    // Zone 4 Materials (Level 30-40)
    const moDotBienLon = await ItemSchema.create({
      name: 'Mô Đột Biến Lớn',
      description: 'Mô sinh học đột biến cỡ lớn, phát ra năng lượng kỳ lạ.',
      type: 'Material',
      value: 25,
      quality: 'Hiếm',
      rarity: 'uncommon'
    });

    const tinhTheNangLuong = await ItemSchema.create({
      name: 'Tinh Thể Năng Lượng',
      description: 'Tinh thể trong suốt chứa năng lượng tinh khiết.',
      type: 'Material',
      value: 35,
      quality: 'Hiếm',
      rarity: 'rare'
    });

    const traiTimDotBienOnDinh = await ItemSchema.create({
      name: 'Trái Tim Đột Biến Ổn Định',
      description: 'Trái tim của sinh vật đột biến mạnh mẽ, vẫn đập đều.',
      type: 'Material',
      value: 150,
      quality: 'Hiếm',
      rarity: 'rare'
    });

    // Zone 5 Materials (Level 40-50)
    const nangLuongTinhKhiet = await ItemSchema.create({
      name: 'Năng Lượng Tinh Khiết',
      description: 'Năng lượng nguyên chất từ vệ binh cổ ngữ.',
      type: 'Material',
      value: 50,
      quality: 'Sử Thi',
      rarity: 'epic'
    });

    const nuocMatCuaThanhCu = await ItemSchema.create({
      name: 'Nước Mắt Của Thành Cũ',
      description: 'Tinh thể lỏng huyền bí, chỉ rơi từ kẻ cai quản mạnh nhất.',
      type: 'Material',
      value: 500,
      quality: 'Sử Thi',
      rarity: 'legendary'
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
      price: 500,
      sellValue: 100,
      quality: 'Thường',
      resultItem: muLangKhach._id,
      recipe: [
        { materialId: daChuot._id, quantity: 5 },
        { materialId: vaiRach._id, quantity: 3 }
      ]
    });

    const congThucAoLangKhach = await ItemSchema.create({
      name: 'Công Thức: Áo Lãng Khách',
      description: 'Bản vẽ chi tiết cách chế tạo Áo Lãng Khách.',
      type: 'Recipe',
      value: 25,
      price: 1000,
      sellValue: 200,
      quality: 'Thường',
      resultItem: aoLangKhach._id,
      recipe: [
        { materialId: daChuot._id, quantity: 8 },
        { materialId: vaiRach._id, quantity: 5 }
      ]
    });

    const congThucQuanLangKhach = await ItemSchema.create({
      name: 'Công Thức: Quần Lãng Khách',
      description: 'Bản vẽ chi tiết cách chế tạo Quần Lãng Khách.',
      type: 'Recipe',
      value: 22,
      price: 800,
      sellValue: 160,
      quality: 'Thường',
      resultItem: quanLangKhach._id,
      recipe: [
        { materialId: daChuot._id, quantity: 6 },
        { materialId: vaiRach._id, quantity: 4 }
      ]
    });

    const congThucGiayLangKhach = await ItemSchema.create({
      name: 'Công Thức: Giày Lãng Khách',
      description: 'Bản vẽ chi tiết cách chế tạo Giày Lãng Khách.',
      type: 'Recipe',
      value: 20,
      price: 600,
      sellValue: 120,
      quality: 'Thường',
      resultItem: giayLangKhach._id,
      recipe: [
        { materialId: daChuot._id, quantity: 4 },
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

    // Phase 22: Zone 2 Equipment Set - "Set Phế Liệu" (Level 20)
    const muPheLieu = await ItemSchema.create({
      name: 'Mũ Phế Liệu',
      description: 'Mũ giáp được hàn từ các mảnh kim loại phế thải.',
      type: 'Equipment',
      slot: 'helmet',
      value: 80,
      quality: 'Tốt',
      requiredLevel: 18,
      setKey: 'set_phe_lieu_cap_20',
      stats: { defense: 8, hp: 40 }
    });

    const aoPheLieu = await ItemSchema.create({
      name: 'Áo Giáp Phế Liệu',
      description: 'Giáp ngực được lắp ráp từ vỏ nhện và kim loại cũ.',
      type: 'Equipment',
      slot: 'chest',
      value: 120,
      quality: 'Tốt',
      requiredLevel: 20,
      setKey: 'set_phe_lieu_cap_20',
      stats: { defense: 12, hp: 60 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['defense', 15], ['hp', 100]]) },
        { requiredPieces: 4, stats: new Map([['defense', 30], ['hp', 200], ['strength', 5]]) }
      ]
    });

    const quanPheLieu = await ItemSchema.create({
      name: 'Quần Giáp Phế Liệu',
      description: 'Quần giáp chắc chắn từ kim loại tái chế.',
      type: 'Equipment',
      slot: 'legs',
      value: 100,
      quality: 'Tốt',
      requiredLevel: 19,
      setKey: 'set_phe_lieu_cap_20',
      stats: { defense: 10, hp: 50 }
    });

    const giayPheLieu = await ItemSchema.create({
      name: 'Ủng Phế Liệu',
      description: 'Ủng kim loại nặng nề nhưng bền chắc.',
      type: 'Equipment',
      slot: 'boots',
      value: 90,
      quality: 'Tốt',
      requiredLevel: 18,
      setKey: 'set_phe_lieu_cap_20',
      stats: { defense: 8, hp: 40 }
    });

    const vukhi20Hiem = await ItemSchema.create({
      name: 'Kiếm Năng Lượng Cổ',
      description: 'Vũ khí hiếm được tạo từ Lõi Cổ Ngữ Hỏng, phát sáng yếu ớt.',
      type: 'Equipment',
      slot: 'weapon',
      value: 200,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 20,
      stats: { damage: 25, strength: 8 }
    });

    // Phase 26: Recipes for Set Phế Liệu (Level 20) - Drop only
    const congThucMuPheLieu = await ItemSchema.create({
      name: 'Công Thức: Mũ Phế Liệu',
      description: 'Bản vẽ chế tạo mũ giáp từ phế liệu kim loại.',
      type: 'Recipe',
      value: 40,
      sellValue: 80,
      quality: 'Tốt',
      resultItem: muPheLieu._id,
      recipe: [
        { materialId: voNhenCung._id, quantity: 10 },
        { materialId: loiNangLuongYeu._id, quantity: 3 }
      ]
    });

    const congThucAoPheLieu = await ItemSchema.create({
      name: 'Công Thức: Áo Giáp Phế Liệu',
      description: 'Bản vẽ chế tạo giáp ngực từ vỏ nhện và kim loại cũ.',
      type: 'Recipe',
      value: 60,
      sellValue: 120,
      quality: 'Tốt',
      resultItem: aoPheLieu._id,
      recipe: [
        { materialId: voNhenCung._id, quantity: 15 },
        { materialId: loiNangLuongYeu._id, quantity: 5 }
      ]
    });

    const congThucQuanPheLieu = await ItemSchema.create({
      name: 'Công Thức: Quần Giáp Phế Liệu',
      description: 'Bản vẽ chế tạo quần giáp từ kim loại tái chế.',
      type: 'Recipe',
      value: 50,
      sellValue: 100,
      quality: 'Tốt',
      resultItem: quanPheLieu._id,
      recipe: [
        { materialId: voNhenCung._id, quantity: 12 },
        { materialId: loiNangLuongYeu._id, quantity: 4 }
      ]
    });

    const congThucGiayPheLieu = await ItemSchema.create({
      name: 'Công Thức: Ủng Phế Liệu',
      description: 'Bản vẽ chế tạo ủng kim loại nặng nề.',
      type: 'Recipe',
      value: 45,
      sellValue: 90,
      quality: 'Tốt',
      resultItem: giayPheLieu._id,
      recipe: [
        { materialId: voNhenCung._id, quantity: 10 },
        { materialId: loiNangLuongYeu._id, quantity: 3 }
      ]
    });

    const congThucVukhi20Hiem = await ItemSchema.create({
      name: 'Công Thức: Kiếm Năng Lượng Cổ',
      description: 'Bản vẽ hiếm chế tạo vũ khí từ Lõi Cổ Ngữ Hỏng.',
      type: 'Recipe',
      value: 100,
      sellValue: 200,
      quality: 'Hiếm',
      rarity: 'rare',
      resultItem: vukhi20Hiem._id,
      recipe: [
        { materialId: loiCoNguHong._id, quantity: 1 },
        { materialId: loiNangLuongYeu._id, quantity: 10 }
      ]
    });

    // Phase 22: Zone 3 Equipment Sets - Class-specific (Level 30)
    // Scrap Engineer Set
    const muKySu30 = await ItemSchema.create({
      name: 'Mũ Kỹ Sư Cao Cấp',
      description: 'Mũ kỹ thuật với màn hình HUD tích hợp.',
      type: 'Equipment',
      slot: 'helmet',
      value: 150,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 28,
      setKey: 'set_ky_su_cap_30',
      stats: { defense: 12, hp: 60, agility: 5 }
    });

    const aoKySu30 = await ItemSchema.create({
      name: 'Áo Giáp Kỹ Sư Cao Cấp',
      description: 'Giáp nhẹ với nhiều túi đựng linh kiện và công cụ.',
      type: 'Equipment',
      slot: 'chest',
      value: 200,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 30,
      setKey: 'set_ky_su_cap_30',
      stats: { defense: 18, hp: 90, agility: 8 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['agility', 15], ['hp', 150]]) },
        { requiredPieces: 4, stats: new Map([['agility', 30], ['damage', 20], ['hp', 300]]) }
      ]
    });

    // Mutant Warrior Set
    const muChienBinh30 = await ItemSchema.create({
      name: 'Mũ Chiến Binh Đột Biến',
      description: 'Mũ giáp nặng từ mô đột biến, tăng sức mạnh.',
      type: 'Equipment',
      slot: 'helmet',
      value: 150,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 28,
      setKey: 'set_chien_binh_cap_30',
      stats: { defense: 15, hp: 80, strength: 5 }
    });

    const aoChienBinh30 = await ItemSchema.create({
      name: 'Giáp Chiến Binh Đột Biến',
      description: 'Giáp dày từ mô sinh học, cung cấp phòng thủ vượt trội.',
      type: 'Equipment',
      slot: 'chest',
      value: 200,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 30,
      setKey: 'set_chien_binh_cap_30',
      stats: { defense: 22, hp: 120, strength: 8 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['strength', 15], ['hp', 200]]) },
        { requiredPieces: 4, stats: new Map([['strength', 30], ['defense', 25], ['hp', 400]]) }
      ]
    });

    // Rune Historian Set
    const muSuGia30 = await ItemSchema.create({
      name: 'Mũ Sử Gia Cổ Ngữ',
      description: 'Mũ uyên bác khắc các ký tự cổ đại.',
      type: 'Equipment',
      slot: 'helmet',
      value: 150,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 28,
      setKey: 'set_su_gia_cap_30',
      stats: { defense: 10, hp: 70 }
    });

    const aoSuGia30 = await ItemSchema.create({
      name: 'Áo Choàng Sử Gia',
      description: 'Áo choàng phép thuật tăng cường khả năng hỗ trợ.',
      type: 'Equipment',
      slot: 'chest',
      value: 200,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 30,
      setKey: 'set_su_gia_cap_30',
      stats: { defense: 15, hp: 100 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['hp', 150]]) },
        { requiredPieces: 4, stats: new Map([['hp', 300], ['defense', 20]]) }
      ]
    });

    // Stalker Set
    const muLungSuc30 = await ItemSchema.create({
      name: 'Mũ Kẻ Lùng Sục',
      description: 'Mũ da mềm giúp di chuyển êm ái.',
      type: 'Equipment',
      slot: 'helmet',
      value: 150,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 28,
      setKey: 'set_lung_suc_cap_30',
      stats: { defense: 10, hp: 60, agility: 8 }
    });

    const aoLungSuc30 = await ItemSchema.create({
      name: 'Áo Giáp Lùng Sục',
      description: 'Giáp da nhẹ tối ưu cho tấn công nhanh.',
      type: 'Equipment',
      slot: 'chest',
      value: 200,
      quality: 'Hiếm',
      rarity: 'uncommon',
      requiredLevel: 30,
      setKey: 'set_lung_suc_cap_30',
      stats: { defense: 16, hp: 90, agility: 12 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['agility', 20], ['hp', 150]]) },
        { requiredPieces: 4, stats: new Map([['agility', 40], ['damage', 25], ['hp', 300]]) }
      ]
    });

    // Phase 22: Zone 4 Equipment Sets - Upgraded Class-specific (Level 40)
    const muKySu40 = await ItemSchema.create({
      name: 'Mũ Kỹ Sư Tinh Anh',
      description: 'Mũ kỹ thuật tiên tiến với AI hỗ trợ.',
      type: 'Equipment',
      slot: 'helmet',
      value: 300,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 38,
      setKey: 'set_ky_su_cap_40',
      stats: { defense: 18, hp: 100, agility: 10 }
    });

    const aoKySu40 = await ItemSchema.create({
      name: 'Áo Giáp Kỹ Sư Tinh Anh',
      description: 'Giáp công nghệ cao với lớp năng lượng bảo vệ.',
      type: 'Equipment',
      slot: 'chest',
      value: 400,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 40,
      setKey: 'set_ky_su_cap_40',
      stats: { defense: 28, hp: 150, agility: 15 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['agility', 25], ['hp', 250]]) },
        { requiredPieces: 4, stats: new Map([['agility', 50], ['damage', 35], ['hp', 500]]) }
      ]
    });

    const muChienBinh40 = await ItemSchema.create({
      name: 'Mũ Chiến Binh Tinh Anh',
      description: 'Mũ giáp sinh học tinh chỉnh, tăng sức mạnh vượt bậc.',
      type: 'Equipment',
      slot: 'helmet',
      value: 300,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 38,
      setKey: 'set_chien_binh_cap_40',
      stats: { defense: 22, hp: 130, strength: 10 }
    });

    const aoChienBinh40 = await ItemSchema.create({
      name: 'Giáp Chiến Binh Tinh Anh',
      description: 'Giáp sinh học hoàn thiện, phòng thủ tuyệt đối.',
      type: 'Equipment',
      slot: 'chest',
      value: 400,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 40,
      setKey: 'set_chien_binh_cap_40',
      stats: { defense: 35, hp: 200, strength: 15 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['strength', 25], ['hp', 350]]) },
        { requiredPieces: 4, stats: new Map([['strength', 50], ['defense', 40], ['hp', 700]]) }
      ]
    });

    const muSuGia40 = await ItemSchema.create({
      name: 'Mũ Sử Gia Tinh Anh',
      description: 'Mũ cổ ngữ tỏa ra hào quang huyền bí.',
      type: 'Equipment',
      slot: 'helmet',
      value: 300,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 38,
      setKey: 'set_su_gia_cap_40',
      stats: { defense: 16, hp: 120 }
    });

    const aoSuGia40 = await ItemSchema.create({
      name: 'Áo Choàng Sử Gia Tinh Anh',
      description: 'Áo choàng phép thuật tinh khiết, tăng cường hỗ trợ mạnh mẽ.',
      type: 'Equipment',
      slot: 'chest',
      value: 400,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 40,
      setKey: 'set_su_gia_cap_40',
      stats: { defense: 24, hp: 170 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['hp', 250]]) },
        { requiredPieces: 4, stats: new Map([['hp', 500], ['defense', 35]]) }
      ]
    });

    const muLungSuc40 = await ItemSchema.create({
      name: 'Mũ Lùng Sục Tinh Anh',
      description: 'Mũ ám sát tinh vi, gần như vô hình.',
      type: 'Equipment',
      slot: 'helmet',
      value: 300,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 38,
      setKey: 'set_lung_suc_cap_40',
      stats: { defense: 16, hp: 100, agility: 15 }
    });

    const aoLungSuc40 = await ItemSchema.create({
      name: 'Áo Giáp Lùng Sục Tinh Anh',
      description: 'Giáp da cao cấp, tối ưu cho ám sát.',
      type: 'Equipment',
      slot: 'chest',
      value: 400,
      quality: 'Hiếm',
      rarity: 'rare',
      requiredLevel: 40,
      setKey: 'set_lung_suc_cap_40',
      stats: { defense: 25, hp: 150, agility: 22 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['agility', 35], ['hp', 250]]) },
        { requiredPieces: 4, stats: new Map([['agility', 70], ['damage', 45], ['hp', 500]]) }
      ]
    });

    // Phase 22: Zone 5 Epic Equipment Sets (Level 50)
    const muKySu50 = await ItemSchema.create({
      name: 'Mũ Kỹ Sư Sử Thi',
      description: 'Mũ công nghệ cổ ngữ tuyệt đỉnh.',
      type: 'Equipment',
      slot: 'helmet',
      value: 600,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 48,
      setKey: 'set_ky_su_cap_50',
      stats: { defense: 28, hp: 180, agility: 20 }
    });

    const aoKySu50 = await ItemSchema.create({
      name: 'Áo Giáp Kỹ Sư Sử Thi',
      description: 'Giáp năng lượng tuyệt đỉnh với lá chắn tự động.',
      type: 'Equipment',
      slot: 'chest',
      value: 800,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 50,
      setKey: 'set_ky_su_cap_50',
      stats: { defense: 42, hp: 280, agility: 30 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['agility', 50], ['hp', 500]]) },
        { requiredPieces: 4, stats: new Map([['agility', 100], ['damage', 70], ['hp', 1000]]) }
      ]
    });

    const muChienBinh50 = await ItemSchema.create({
      name: 'Mũ Chiến Binh Sử Thi',
      description: 'Mũ sinh học cổ ngữ, phát ra hào quang đỏ rực.',
      type: 'Equipment',
      slot: 'helmet',
      value: 600,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 48,
      setKey: 'set_chien_binh_cap_50',
      stats: { defense: 35, hp: 250, strength: 20 }
    });

    const aoChienBinh50 = await ItemSchema.create({
      name: 'Giáp Chiến Binh Sử Thi',
      description: 'Giáp hữu cơ tối thượng, gần như bất khả xâm phạm.',
      type: 'Equipment',
      slot: 'chest',
      value: 800,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 50,
      setKey: 'set_chien_binh_cap_50',
      stats: { defense: 55, hp: 400, strength: 30 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['strength', 50], ['hp', 700]]) },
        { requiredPieces: 4, stats: new Map([['strength', 100], ['defense', 70], ['hp', 1400]]) }
      ]
    });

    const muSuGia50 = await ItemSchema.create({
      name: 'Mũ Sử Gia Sử Thi',
      description: 'Vương miện cổ ngữ của bậc thầy phép thuật.',
      type: 'Equipment',
      slot: 'helmet',
      value: 600,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 48,
      setKey: 'set_su_gia_cap_50',
      stats: { defense: 25, hp: 220 }
    });

    const aoSuGia50 = await ItemSchema.create({
      name: 'Áo Choàng Sử Gia Sử Thi',
      description: 'Áo choàng huyền thoại dệt từ năng lượng tinh khiết.',
      type: 'Equipment',
      slot: 'chest',
      value: 800,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 50,
      setKey: 'set_su_gia_cap_50',
      stats: { defense: 38, hp: 350 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['hp', 500]]) },
        { requiredPieces: 4, stats: new Map([['hp', 1000], ['defense', 60]]) }
      ]
    });

    const muLungSuc50 = await ItemSchema.create({
      name: 'Mũ Lùng Sục Sử Thi',
      description: 'Mũ bóng tối tối thượng, người đeo gần như vô hình.',
      type: 'Equipment',
      slot: 'helmet',
      value: 600,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 48,
      setKey: 'set_lung_suc_cap_50',
      stats: { defense: 25, hp: 180, agility: 30 }
    });

    const aoLungSuc50 = await ItemSchema.create({
      name: 'Áo Giáp Lùng Sục Sử Thi',
      description: 'Giáp ám sát huyền thoại, bất khả xâm phạm bởi ánh sáng.',
      type: 'Equipment',
      slot: 'chest',
      value: 800,
      quality: 'Sử Thi',
      rarity: 'epic',
      requiredLevel: 50,
      setKey: 'set_lung_suc_cap_50',
      stats: { defense: 40, hp: 280, agility: 45 },
      setBonus: [
        { requiredPieces: 2, stats: new Map([['agility', 70], ['hp', 500]]) },
        { requiredPieces: 4, stats: new Map([['agility', 140], ['damage', 90], ['hp', 1000]]) }
      ]
    });

    // Pet Templates
    const wolfTemplate = await PetTemplateSchema.create({
      petKey: 'wolf',
      name: 'Sói',
      description: 'Một con sói dũng mãnh với bộ lông bạc óng ánh. Trung thành và mạnh mẽ.',
      baseStats: {
        hp: 80,
        attack: 12,
        defense: 5
      },
      statGrowth: {
        hpPerLevel: 15,
        attackPerLevel: 2,
        defensePerLevel: 1
      }
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

    const phòngKhóTreasure = await RoomSchema.create({
      name: 'Phòng Kho Báu',
      description: 'Một phòng nhỏ với nhiều rương gỗ. Không khí tĩnh lặng đến đáng ngờ. Có vẻ như ai đó đã ở đây trước bạn.',
      exits: {},
      items: [binhMauLon._id, kiemThep._id],
      agents: []
    });

    const sânLuyệnTập = await RoomSchema.create({
      name: 'Sân Luyện Tập',
      description: 'Một sân tập rộng với nhiều mục tiêu và vũ khí tập luyện. Có vẻ như vẫn còn được sử dụng thường xuyên.',
      exits: {},
      items: [],
      agents: []
    });

    // Phase 22: Zone 2 - Hầm Ngầm Bỏ Hoang (Abandoned Sewers) - 7 rooms total
    const loiVaoHamNgam = await RoomSchema.create({
      name: 'Lối Vào Hầm Ngầm',
      description: 'Lối xuống tối tăm với các bậc đá ẩm ướt. Mùi hôi thối nồng nặc thoát lên từ bên dưới.',
      exits: {},
      items: [],
      agents: []
    });

    const hamNgam2 = await RoomSchema.create({
      name: 'Đường Hầm Cong',
      description: 'Đường hầm uốn cong với ánh sáng yếu ớt từ rêu phát quang. Tiếng nước nhỏ giọt vang vọng.',
      exits: {},
      items: [],
      agents: []
    });

    const hamNgam4 = await RoomSchema.create({
      name: 'Ổ Nhện Khổng Lồ',
      description: 'Căn phòng phủ đầy mạng nhện dày đặc. Xương cốt nạn nhân nằm rải rác.',
      exits: {},
      items: [],
      agents: []
    });

    const hamNgamBoss = await RoomSchema.create({
      name: 'Phòng Điều Khiển Cống',
      description: 'Phòng điều khiển trung tâm với màn hình và bảng điều khiển hỏng hóc. Một robot khổng lồ đứng ở giữa.',
      exits: {},
      items: [],
      agents: []
    });

    // Simplified: Create 3 more sewer rooms with variation (bulk insert)
    const sewerRoomDocs = [];
    for (let i = 5; i <= 7; i++) {
      sewerRoomDocs.push({
        name: `Hầm Ngầm Khu ${i}`,
        description: `Khu vực hầm ngầm tối tăm, nước bẩn chảy ào ạt. ${i % 3 === 0 ? 'Có tiếng động lạ phía trước.' : i % 3 === 1 ? 'Mùi hôi thối nồng nặc.' : 'Tường phủ đầy rêu độc.'}`,
        exits: {},
        items: [],
        agents: []
      });
    }
    const sewerRooms = await RoomSchema.insertMany(sewerRoomDocs);

    // Phase 22: Zone 3 - Nhà Máy Lắp Ráp Cũ (Old Assembly Plant) - 9 rooms total
    const loiVaoNhaMay = await RoomSchema.create({
      name: 'Cổng Nhà Máy',
      description: 'Cổng sắt khổng lồ đã rỉ sét nửa mở. Biển báo "Nguy Hiểm - Cấm Vào" đã phai màu.',
      exits: {},
      items: [],
      agents: []
    });

    const nhaMay2 = await RoomSchema.create({
      name: 'Phân Xưởng A',
      description: 'Phân xưởng lắp ráp với robot bảo vệ rỉ sét đang tuần tra.',
      exits: {},
      items: [],
      agents: []
    });

    const nhaMay3 = await RoomSchema.create({
      name: 'Phòng Thí Nghiệm Nhỏ',
      description: 'Phòng lab nhỏ với các bình chứa vỡ. Chất lỏng xanh rò rỉ ra sàn.',
      exits: {},
      items: [],
      agents: []
    });

    const nhaMayBoss = await RoomSchema.create({
      name: 'Phòng Thử Nghiệm Chính',
      description: 'Phòng thử nghiệm rộng lớn. Robot Sát Thủ Mẫu 01 đứng ở trung tâm, đèn LED đỏ nhấp nháy.',
      exits: {},
      items: [],
      agents: []
    });

    // Simplified: Create 5 more factory rooms (bulk insert)
    const factoryRoomDocs = [];
    for (let i = 4; i <= 8; i++) {
      factoryRoomDocs.push({
        name: `Khu Vực Nhà Máy ${i}`,
        description: `${i % 4 === 0 ? 'Phân xưởng' : i % 4 === 1 ? 'Kho chứa' : i % 4 === 2 ? 'Hành lang' : 'Phòng kỹ thuật'} số ${i}. ${i % 2 === 0 ? 'Máy móc rỉ sét nằm la liệt.' : 'Có dấu hiệu hoạt động gần đây.'}`,
        exits: {},
        items: [],
        agents: []
      });
    }
    const factoryRooms = await RoomSchema.insertMany(factoryRoomDocs);

    // Phase 22: Zone 4 - Phòng Thí Nghiệm Bị Chôn Vùi (Sunken Laboratory) - 9 rooms total
    const loiVaoPhongLab = await RoomSchema.create({
      name: 'Lối Vào Phòng Lab',
      description: 'Lối vào bị ngập nước. Cửa kim loại dày bị cong vênh. Cảnh báo sinh học phát sáng đỏ.',
      exits: {},
      items: [],
      agents: []
    });

    const phongLab1 = await RoomSchema.create({
      name: 'Tiền Sảnh Lab',
      description: 'Tiền sảnh ngập nửa mét nước. Bàn tiếp tân đổ ngã. Máu khô dính trên tường.',
      exits: {},
      items: [],
      agents: []
    });

    const phongLab2 = await RoomSchema.create({
      name: 'Phòng Nuôi Cấy',
      description: 'Phòng đầy bể nuôi cấy vỡ. Sinh vật thí nghiệm lỗi lang thang trong đống mảnh vỡ.',
      exits: {},
      items: [],
      agents: []
    });

    const phongLabBoss = await RoomSchema.create({
      name: 'Phòng Thí Nghiệm Chính',
      description: 'Phòng lab trung tâm khổng lồ. Bể nuôi lớn nhất đã vỡ. "Quái Vật Mẹ" nằm ở trung tâm, bao quanh bởi các đệ tử.',
      exits: {},
      items: [],
      agents: []
    });

    // Simplified: Create 5 more lab rooms (bulk insert)
    const labRoomDocs = [];
    for (let i = 3; i <= 7; i++) {
      labRoomDocs.push({
        name: `Phòng Lab Khu ${i}`,
        description: `${i % 5 === 0 ? 'Phòng thí nghiệm' : i % 5 === 1 ? 'Kho mẫu vật' : i % 5 === 2 ? 'Phòng quan sát' : i % 5 === 3 ? 'Phòng khử trùng' : 'Hành lang lab'} số ${i}. Ngập nước và tối tăm.`,
        exits: {},
        items: [],
        agents: []
      });
    }
    const labRooms = await RoomSchema.insertMany(labRoomDocs);

    // Phase 22: Zone 5 - Trung Tâm Vong Tích Thành (Citadel Core) - 8 elite rooms total
    const loiVaoTrungTam = await RoomSchema.create({
      name: 'Cổng Vào Trung Tâm',
      description: 'Cổng khổng lồ bằng kim loại cổ đại. Các ký tự phát sáng xanh lam. Năng lượng dày đặc trong không khí.',
      exits: {},
      items: [],
      agents: []
    });

    const trungTam1 = await RoomSchema.create({
      name: 'Đại Sảnh Cổ Ngữ',
      description: 'Đại sảnh tráng lệ với trần vòm cao. Vệ binh cổ ngữ đứng canh gác.',
      exits: {},
      items: [],
      agents: []
    });

    const trungTam2 = await RoomSchema.create({
      name: 'Thư Viện Cổ',
      description: 'Thư viện đầy sách cổ và cuộn giấy da. Pháp sư vong tích đang nghiên cứu.',
      exits: {},
      items: [],
      agents: []
    });

    const trungTamBoss = await RoomSchema.create({
      name: 'Ngai Vàng Kẻ Cai Quản',
      description: 'Phòng ngai vàng rộng lớn. Kẻ Cai Quản Cổ Ngữ ngồi trên ngai, tỏa ra hào quang uy nghi.',
      exits: {},
      items: [],
      agents: []
    });

    // Simplified: Create 4 more citadel rooms (bulk insert)
    const citadelRoomDocs = [];
    for (let i = 3; i <= 6; i++) {
      citadelRoomDocs.push({
        name: `Trung Tâm Khu ${i}`,
        description: `${i % 4 === 0 ? 'Phòng nghi lễ' : i % 4 === 1 ? 'Hành lang cổ đại' : i % 4 === 2 ? 'Phòng bảo vật' : 'Đền thờ nhỏ'} trong Citadel Core. Năng lượng cổ ngữ bao trùm.`,
        exits: {},
        items: [],
        agents: []
      });
    }
    const citadelRooms = await RoomSchema.insertMany(citadelRoomDocs);

    // Link rooms with exits - create a connected world
    // Zone 1 (Starting Zone)
    cổngThành.exits.north = khuCho._id;
    cổngThành.exits.east = rừngRậm._id;
    
    khuCho.exits.south = cổngThành._id;
    khuCho.exits.east = hẻmTối._id;
    khuCho.exits.north = quảngTrường._id;
    khuCho.exits.west = sânLuyệnTập._id;
    khuCho.exits.down = loiVaoHamNgam._id; // Link to Zone 2
    
    hẻmTối.exits.west = khuCho._id;
    
    quảngTrường.exits.south = khuCho._id;
    quảngTrường.exits.north = phòngKhóTreasure._id; // Direct connection, bypassing removed rooms
    
    rừngRậm.exits.west = cổngThành._id;
    rừngRậm.exits.north = hang._id;
    
    hang.exits.south = rừngRậm._id;
    
    phòngKhóTreasure.exits.south = quảngTrường._id; // Direct connection back
    
    sânLuyệnTập.exits.east = khuCho._id;

    // Zone 2 (Sewers) - Simplified linear connection
    loiVaoHamNgam.exits.up = khuCho._id;
    loiVaoHamNgam.exits.south = hamNgam2._id; // Direct connection, bypassing hamNgam1
    
    hamNgam2.exits.north = loiVaoHamNgam._id; // Direct connection back
    hamNgam2.exits.south = hamNgam4._id; // Direct connection, bypassing hamNgam3
    
    hamNgam4.exits.north = hamNgam2._id; // Direct connection back
    hamNgam4.exits.south = sewerRooms[0]._id;
    
    // Link sewer rooms in a winding path
    for (let i = 0; i < sewerRooms.length - 1; i++) {
      sewerRooms[i].exits.south = sewerRooms[i + 1]._id;
      sewerRooms[i + 1].exits.north = sewerRooms[i]._id;
    }
    
    sewerRooms[sewerRooms.length - 1].exits.east = hamNgamBoss._id;
    hamNgamBoss.exits.west = sewerRooms[sewerRooms.length - 1]._id;
    hamNgamBoss.exits.north = loiVaoNhaMay._id; // Link to Zone 3

    // Zone 3 (Factory)
    loiVaoNhaMay.exits.south = hamNgamBoss._id;
    loiVaoNhaMay.exits.north = nhaMay2._id; // Direct connection, bypassing nhaMay1
    
    nhaMay2.exits.south = loiVaoNhaMay._id; // Direct connection back
    nhaMay2.exits.north = nhaMay3._id;
    
    nhaMay3.exits.south = nhaMay2._id;
    nhaMay3.exits.east = factoryRooms[0]._id;
    
    // Link factory rooms
    for (let i = 0; i < factoryRooms.length - 1; i++) {
      factoryRooms[i].exits.east = factoryRooms[i + 1]._id;
      factoryRooms[i + 1].exits.west = factoryRooms[i]._id;
    }
    
    factoryRooms[factoryRooms.length - 1].exits.north = nhaMayBoss._id;
    nhaMayBoss.exits.south = factoryRooms[factoryRooms.length - 1]._id;
    nhaMayBoss.exits.down = loiVaoPhongLab._id; // Link to Zone 4

    // Zone 4 (Lab)
    loiVaoPhongLab.exits.up = nhaMayBoss._id;
    loiVaoPhongLab.exits.north = phongLab1._id;
    
    phongLab1.exits.south = loiVaoPhongLab._id;
    phongLab1.exits.east = phongLab2._id;
    
    phongLab2.exits.west = phongLab1._id;
    phongLab2.exits.north = labRooms[0]._id;
    
    // Link lab rooms
    for (let i = 0; i < labRooms.length - 1; i++) {
      labRooms[i].exits.north = labRooms[i + 1]._id;
      labRooms[i + 1].exits.south = labRooms[i]._id;
    }
    
    labRooms[labRooms.length - 1].exits.east = phongLabBoss._id;
    phongLabBoss.exits.west = labRooms[labRooms.length - 1]._id;
    phongLabBoss.exits.up = loiVaoTrungTam._id; // Link to Zone 5

    // Zone 5 (Citadel Core)
    loiVaoTrungTam.exits.down = phongLabBoss._id;
    loiVaoTrungTam.exits.north = trungTam1._id;
    
    trungTam1.exits.south = loiVaoTrungTam._id;
    trungTam1.exits.east = trungTam2._id;
    
    trungTam2.exits.west = trungTam1._id;
    trungTam2.exits.north = citadelRooms[0]._id;
    
    // Link citadel rooms
    for (let i = 0; i < citadelRooms.length - 1; i++) {
      citadelRooms[i].exits.north = citadelRooms[i + 1]._id;
      citadelRooms[i + 1].exits.south = citadelRooms[i]._id;
    }
    
    citadelRooms[citadelRooms.length - 1].exits.north = trungTamBoss._id;
    trungTamBoss.exits.south = citadelRooms[citadelRooms.length - 1]._id;

    // Save all rooms
    await cổngThành.save();
    await khuCho.save();
    await hẻmTối.save();
    await quảngTrường.save();
    await rừngRậm.save();
    await hang.save();
    await phòngKhóTreasure.save();
    await sânLuyệnTập.save();
    
    // Save Zone 2 rooms
    await loiVaoHamNgam.save();
    await hamNgam2.save();
    await hamNgam4.save();
    await hamNgamBoss.save();
    for (const room of sewerRooms) await room.save();
    
    // Save Zone 3 rooms
    await loiVaoNhaMay.save();
    await nhaMay2.save();
    await nhaMay3.save();
    await nhaMayBoss.save();
    for (const room of factoryRooms) await room.save();
    
    // Save Zone 4 rooms
    await loiVaoPhongLab.save();
    await phongLab1.save();
    await phongLab2.save();
    await phongLabBoss.save();
    for (const room of labRooms) await room.save();
    
    // Save Zone 5 rooms
    await loiVaoTrungTam.save();
    await trungTam1.save();
    await trungTam2.save();
    await trungTamBoss.save();
    for (const room of citadelRooms) await room.save();

    // Dungeon System: Create dungeon rooms
    const dungeonLobby = await RoomSchema.create({
      name: 'Sảnh Hầm Ngục',
      description: 'Một sảnh rộng với cổng đá lớn dẫn vào hầm ngục. Ánh sáng lờ mờ từ những ngọn đuốc treo tường. Có một thương nhân đứng ở góc phòng.',
      exits: {
        north: khuChoCu._id, // Link back to main area
      },
    });

    const dungeonInstance = await RoomSchema.create({
      name: 'Hầm Ngục - Phòng Chiến',
      description: 'Một phòng chiến rộng lớn với bầu không khí ngột ngạt. Đây là nơi bạn đối mặt với thử thách.',
      exits: {
        south: dungeonLobby._id,
      },
    });

    dungeonLobby.exits.up = dungeonInstance._id;
    await dungeonLobby.save();
    await dungeonInstance.save();

    // Pet Trial System: Create trial tower rooms
    const trialLobby = await RoomSchema.create({
      name: 'Sảnh Tháp Thử Luyện',
      description: 'Một sảnh cao với ánh sáng xanh phát ra từ các cột pha lê. Trên tường khắc những hình vẽ về các Huấn Luyện Sư huyền thoại cùng thú cưng của họ. Không khí tràn đầy năng lượng kỳ lạ.',
      exits: {},
    });

    const trialInstance = await RoomSchema.create({
      name: 'Tháp Thử Luyện - Đấu Trường',
      description: 'Một đấu trường rộng lớn với sàn đá cứng. Xung quanh là các hàng ghế đá trống rỗng, như thể từng chứng kiến vô số trận chiến. Đây là nơi thú cưng của bạn phải chiến đấu một mình.',
      exits: {
        down: trialLobby._id,
      },
      isSafeZone: false,
    });

    trialLobby.exits.up = trialInstance._id;
    trialLobby.exits.east = cổngThành._id; // Link back to main area
    cổngThành.exits.west = trialLobby._id; // Link to trial tower (use west exit)
    await trialLobby.save();
    await trialInstance.save();

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
        'Đừng gây rối. Nếu muốn tìm việc, đến khu chợ tìm [Thợ Rèn].',
        'Thành phố này đã không còn như xưa nữa...',
        'Cẩn thận khi đi vào hẻm. Có nhiều chuột biến dị ở đó.'
      ]
    });

    const thuongGia = await AgentSchema.create({
      name: 'Thợ Rèn',
      description: 'Một người thợ rèn khỏe mạnh với tạp dề da đen xì. Anh ta đứng sau quầy hàng với nhiều vật phẩm và công cụ.',
      type: 'npc',
      currentRoomId: khuCho._id,
      hp: 80,
      maxHp: 80,
      level: 3,
      damage: 5,
      behavior: 'passive',
      dialogue: [
        'Chào mừng đến lò rèn! Gõ \'list\' để xem hàng của tôi.',
        'Tôi có công thức chế tạo và thuốc hồi máu. Mua đi!',
        'Nếu tìm được nguyên liệu, tôi có thể dạy ngươi cách chế tạo trang bị.'
      ],
      shopItems: [], // Legacy field - replaced by shopInventory
      // Phase 26: Vendor System - Updated shop inventory
      isVendor: true,
      shopInventory: [
        binhMau._id,
        binhNangLuongNho._id,
        dichChuyenVeChoCu._id,
        daCuongHoaCap1._id,
        daTinhLuyen._id,
        congThucMuLangKhach._id,
        congThucAoLangKhach._id,
        congThucQuanLangKhach._id,
        congThucGiayLangKhach._id
      ],
      shopType: 'gold'
    });

    const petTamer = await AgentSchema.create({
      name: 'Huấn Luyện Sư Kito',
      description: 'Một người đàn ông với mái tóc bạc và đôi mắt sắc bén. Xung quanh ông có vài con thú nhỏ đang chơi đùa.',
      type: 'npc',
      agentKey: 'pet_tamer',
      currentRoomId: cổngThành._id,
      hp: 120,
      maxHp: 120,
      level: 15,
      damage: 20,
      behavior: 'passive',
      dialogue: [
        'Chào mừng đến với thế giới của Huấn Luyện Sư! Gõ "list" để xem cửa hàng của ta.',
        'Ta có thể dạy ngươi cách huấn luyện và chăm sóc thú cưng.',
        'Muốn thử sức với Tháp Thử Luyện? Gõ "thử luyện" để bắt đầu!',
        'Huy Hiệu Huấn Luyện có thể đổi lấy vật phẩm quý hiếm cho thú cưng.'
      ],
      isVendor: true,
      shopInventory: [
        // Basic items - can be bought with gold
        trungSoi._id,
        thucAnPetSoCap._id,
        thucAnPetCaoCap._id,
        sachKyNangPetCanXe._id,
        theDoiTenPet._id,
        binhMauPetNho._id,
        thuocCuongHoaPet._id,
        // Premium items - require Tamer Badge from Pet Trial Tower
        daTayTuyPet._id,
        trungPhuongHoang._id,
        thucAnPetSieuCap._id,
        sachKyNangPetPhunLua._id,
        sachKyNangPetTanCong._id,
        binhMauPetLon._id,
        thuocPhongThuPet._id
      ],
      shopType: 'gold',
      shopCurrency: 'tamer_badge'
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
        { itemId: vaiRach._id, dropChance: 0.3 },  // 30% chance
        { itemId: ruongGoNho._id, dropChance: 0.01 } // Phase 26: 1% chance for container
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
      patrolRoute: [quảngTrường._id, phòngKhóTreasure._id, quảngTrường._id],
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
      shopItems: [], // Legacy field - replaced by shopInventory
      // Phase 25: Vendor System
      isVendor: true,
      shopInventory: [binhMauLon._id, aoGiapNhe._id],
      shopType: 'gold',
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
      shopItems: [], // Legacy field - replaced by shopInventory
      // Phase 25: Vendor System
      isVendor: true,
      shopInventory: [theExpX2._id, theExpX3._id],
      shopType: 'premium',
      experience: 0
    });

    // Dungeon System: Dungeon Merchant NPC
    const dungeonMerchant = await AgentSchema.create({
      name: 'Thương Nhân Hầm Ngục',
      description: 'Một thương nhân bí ẩn chuyên bán đồ quý hiếm bằng Xu Hầm Ngục. Mắt người này lấp lánh với sự tham lam.',
      type: 'npc',
      currentRoomId: dungeonLobby._id,
      hp: 200,
      maxHp: 200,
      level: 50,
      damage: 50,
      behavior: 'passive',
      dialogue: [
        'Chào mừng đến với cửa hàng đặc biệt của ta. Ta chỉ nhận Xu Hầm Ngục.',
        'Những vật phẩm ở đây chỉ dành cho những người mạnh nhất.',
        'Hãy chinh phục hầm ngục để kiếm Xu Hầm Ngục.'
      ],
      isVendor: true,
      shopInventory: [daNangSaoSoCap._id, daTinhLuyen._id, kiemHamNguc._id, aoGiapHamNguc._id], // High-tier items
      shopCurrency: 'dungeon_coin',
      experience: 0
    });

    // Phase 22: Zone 1 New NPCs and Mobs (Level 1-10)
    const giaLang = await AgentSchema.create({
      name: 'Già Làng',
      description: 'Một ông già hiền lành với bộ râu bạc. Ông ta là người hướng dẫn người mới.',
      type: 'npc',
      currentRoomId: cổngThành._id,
      hp: 150,
      maxHp: 150,
      level: 10,
      damage: 15,
      behavior: 'passive',
      dialogue: [
        'Chào mừng con đến với Vong Tích Thành. Ta sẽ hướng dẫn con.',
        'Hãy tiêu diệt 10 Chuột Cống và thu thập Vải Rách để bắt đầu.',
        'Nói chuyện với Thợ Rèn ở Khu Chợ khi con đã sẵn sàng.'
      ],
      experience: 0
    });

    const chuotCong = await AgentSchema.create({
      name: 'Chuột Cống',
      description: 'Chuột nhỏ sinh sống trong cống, yếu ớt nhưng hung hãn khi đói.',
      type: 'mob',
      currentRoomId: hẻmTối._id,
      hp: 20,
      maxHp: 20,
      level: 1,
      damage: 3,
      behavior: 'aggressive',
      loot: [],
      experience: 10,
      lootTable: [
        { itemId: daChuot._id, dropChance: 0.4 },
        { itemId: vaiRach._id, dropChance: 0.3 },
        { itemId: ruongGoNho._id, dropChance: 0.01 } // Phase 26: 1% chance
      ]
    });

    const thayMaYeu = await AgentSchema.create({
      name: 'Thây Ma Yếu',
      description: 'Xác sống yếu ớt, di chuyển chậm chạp. Toát ra mùi tử khí.',
      type: 'mob',
      currentRoomId: rừngRậm._id,
      hp: 40,
      maxHp: 40,
      level: 4,
      damage: 6,
      behavior: 'wander',
      loot: [],
      experience: 25,
      lootTable: [
        { itemId: vaiRach._id, dropChance: 0.6 },
        { itemId: daChuot._id, dropChance: 0.3 },
        { itemId: ruongGoNho._id, dropChance: 0.01 } // Phase 26: 1% chance
      ]
    });

    const keCuopDuong = await AgentSchema.create({
      name: 'Kẻ Cướp Đường',
      description: 'Tên cướp hung hãn với dao găm rỉ sét. Mắt đỏ ngầu tham lam.',
      type: 'mob',
      currentRoomId: rừngRậm._id,
      hp: 70,
      maxHp: 70,
      level: 7,
      damage: 10,
      behavior: 'aggressive',
      loot: [],
      experience: 45,
      lootTable: [
        { itemId: daChuot._id, dropChance: 0.5 },
        { itemId: vaiRach._id, dropChance: 0.5 },
        { itemId: congThucMuLangKhach._id, dropChance: 0.15 },
        { itemId: ruongGoNho._id, dropChance: 0.01 } // Phase 26: 1% chance
      ]
    });

    // Phase 26: Zone 1 Boss (Level 10) - Drops Chìa Khóa Hầm Ngầm
    const thuLinhKeCuop = await AgentSchema.create({
      name: 'Thủ Lĩnh Kẻ Cướp',
      description: 'Thủ lĩnh của băng cướp, mặc áo giáp da dày và cầm rìu hai tay lớn. Sẹo dài chạy từ trán xuống má.',
      type: 'mob',
      currentRoomId: hang._id,
      hp: 350,
      maxHp: 350,
      level: 10,
      damage: 18,
      behavior: 'aggressive',
      loot: [],
      experience: 150,
      agentType: 'boss',
      mechanics: ['heavy_strike', 'battle_roar'],
      lootTable: [
        { itemId: chiaKhoaHamNgam._id, dropChance: 1.0 }, // 100% boss drop - unlocks Zone 2
        { itemId: daChuot._id, dropChance: 0.9 },
        { itemId: vaiRach._id, dropChance: 0.9 },
        { itemId: daCuongHoaCap1._id, dropChance: 0.3 }, // 30% chance for enhancement stone
        { itemId: daTinhLuyen._id, dropChance: 0.15 }, // 15% chance for refine stone
        { itemId: ruongGoNho._id, dropChance: 0.15 } // Small chance for container
      ]
    });

    // Phase 22: Zone 2 NPCs and Mobs (Level 10-20)
    const thoSanPheLieu = await AgentSchema.create({
      name: 'Thợ Săn Phế Liệu',
      description: 'Người săn lùng đồ phế thải trong hầm ngầm. Mặc áo giáp kim loại tái chế.',
      type: 'npc',
      currentRoomId: loiVaoHamNgam._id,
      hp: 200,
      maxHp: 200,
      level: 15,
      damage: 20,
      behavior: 'passive',
      dialogue: [
        'Hầm ngầm này đầy những thứ giá trị... và nguy hiểm.',
        'Thu thập 20 Vỏ Nhện Cứng cho ta, ta sẽ trả công xứng đáng.',
        'Robot Quản Lý Cống ở sâu trong hầm rất nguy hiểm.'
      ],
      experience: 0
    });

    const nhenDotBien = await AgentSchema.create({
      name: 'Nhện Đột Biến',
      description: 'Nhện khổng lồ với nhiều mắt đỏ rực. Nọc độc nhỏ giọt từ nanh.',
      type: 'mob',
      currentRoomId: hamNgam2._id,
      hp: 120,
      maxHp: 120,
      level: 12,
      damage: 15,
      behavior: 'aggressive',
      loot: [],
      experience: 80,
      agentType: 'mob',
      lootTable: [
        { itemId: voNhenCung._id, dropChance: 0.6 },
        { itemId: loiNangLuongYeu._id, dropChance: 0.3 },
        { itemId: congThucMuPheLieu._id, dropChance: 0.05 },
        { itemId: congThucGiayPheLieu._id, dropChance: 0.05 },
        { itemId: ruongGoNho._id, dropChance: 0.01 }
      ]
    });

    const nguoiCongNgam = await AgentSchema.create({
      name: 'Người Cống Ngầm',
      description: 'Sinh vật nhân hình biến dạng sống trong hầm ngầm. Da xanh nhợt nhạt.',
      type: 'mob',
      currentRoomId: hamNgam4._id,
      hp: 150,
      maxHp: 150,
      level: 16,
      damage: 20,
      behavior: 'aggressive',
      loot: [],
      experience: 120,
      agentType: 'mob',
      lootTable: [
        { itemId: voNhenCung._id, dropChance: 0.5 },
        { itemId: loiNangLuongYeu._id, dropChance: 0.4 },
        { itemId: congThucAoPheLieu._id, dropChance: 0.05 },
        { itemId: congThucQuanPheLieu._id, dropChance: 0.05 },
        { itemId: ruongGoNho._id, dropChance: 0.01 }
      ]
    });

    const robotQuanLyCong = await AgentSchema.create({
      name: 'Robot Quản Lý Cống',
      description: 'Robot cổ đại khổng lồ vẫn đang vận hành. Đèn LED đỏ nhấp nháy cảnh báo.',
      type: 'mob',
      currentRoomId: hamNgamBoss._id,
      hp: 500,
      maxHp: 500,
      level: 20,
      damage: 35,
      behavior: 'aggressive',
      loot: [],
      experience: 300,
      agentType: 'boss',
      mechanics: ['shield_regeneration'],
      lootTable: [
        { itemId: loiCoNguHong._id, dropChance: 1.0 }, // 100% boss drop - for rare weapon recipe
        { itemId: voNhenCung._id, dropChance: 0.8 },
        { itemId: loiNangLuongYeu._id, dropChance: 0.8 },
        { itemId: daCuongHoaCap1._id, dropChance: 0.4 }, // 40% chance for enhancement stone
        { itemId: daNangSaoSoCap._id, dropChance: 0.2 }, // 20% chance for star stone
        { itemId: daTinhLuyen._id, dropChance: 0.25 }, // 25% chance for refine stone
        { itemId: congThucVukhi20Hiem._id, dropChance: 0.1 } // Phase 26: 10% drop for rare weapon recipe
      ]
    });

    // Phase 22: Zone 3 NPCs and Mobs (Level 20-30)
    const kySuTruongCu = await AgentSchema.create({
      name: 'Kỹ Sư Trưởng Cũ',
      description: 'Kỹ sư già từng làm việc tại nhà máy. Mang theo nhiều công cụ cổ.',
      type: 'npc',
      currentRoomId: loiVaoNhaMay._id,
      hp: 300,
      maxHp: 300,
      level: 25,
      damage: 30,
      behavior: 'passive',
      dialogue: [
        'Nhà máy này từng là niềm tự hào của tôi...',
        'Thu thập Bánh Răng và Mô Đột Biến, tôi sẽ chế tạo đồ tốt cho ngươi.',
        'Robot Sát Thủ Mẫu 01 rất nguy hiểm, hãy cẩn thận.'
      ],
      experience: 0
    });

    const robotBaoVeRiSet = await AgentSchema.create({
      name: 'Robot Bảo Vệ Rỉ Sét',
      description: 'Robot bảo vệ cũ kỹ, rỉ sét nhưng vẫn hoạt động. Vũ khí đã lỗi thời.',
      type: 'mob',
      currentRoomId: nhaMay2._id,
      hp: 180,
      maxHp: 180,
      level: 22,
      damage: 25,
      behavior: 'patrol',
      patrolRoute: [nhaMay2._id, nhaMay3._id],
      loot: [],
      experience: 150,
      agentType: 'mob',
      lootTable: [
        { itemId: banhRangRiSet._id, dropChance: 0.7 },
        { itemId: loiNangLuongYeu._id, dropChance: 0.4 }
      ]
    });

    const congNhanBienDi = await AgentSchema.create({
      name: 'Công Nhân Biến Dị',
      description: 'Công nhân bị đột biến bởi hóa chất. Thân hình biến dạng, mắt trống rỗng.',
      type: 'mob',
      currentRoomId: nhaMay3._id,
      hp: 220,
      maxHp: 220,
      level: 26,
      damage: 30,
      behavior: 'wander',
      loot: [],
      experience: 180,
      agentType: 'mob',
      lootTable: [
        { itemId: moDotBienNho._id, dropChance: 0.7 },
        { itemId: banhRangRiSet._id, dropChance: 0.3 }
      ]
    });

    const robotSatThuMau01 = await AgentSchema.create({
      name: 'Robot Sát Thủ Mẫu 01',
      description: 'Robot chiến đấu nguyên mẫu. Vũ khí tích hợp, AI thông minh, di chuyển nhanh.',
      type: 'mob',
      currentRoomId: nhaMayBoss._id,
      hp: 800,
      maxHp: 800,
      level: 30,
      damage: 50,
      behavior: 'aggressive',
      loot: [],
      experience: 500,
      agentType: 'boss',
      mechanics: ['rapid_fire', 'dash_attack'],
      lootTable: [
        { itemId: chipViMachCo._id, dropChance: 1.0 }, // 100% boss drop
        { itemId: banhRangRiSet._id, dropChance: 0.9 },
        { itemId: moDotBienNho._id, dropChance: 0.9 },
        { itemId: daCuongHoaCap1._id, dropChance: 0.5 }, // 50% chance for enhancement stone
        { itemId: daNangSaoSoCap._id, dropChance: 0.3 }, // 30% chance for star stone
        { itemId: daTinhLuyen._id, dropChance: 0.35 } // 35% chance for refine stone
      ]
    });

    // Phase 22: Zone 4 NPCs and Mobs (Level 30-40)
    const giaoSuBiAn = await AgentSchema.create({
      name: 'Giáo Sư Bí Ẩn',
      description: 'Nhà khoa học bị mắc kẹt trong phòng lab. Áo choàng trắng dính đầy máu khô.',
      type: 'npc',
      currentRoomId: loiVaoPhongLab._id,
      hp: 400,
      maxHp: 400,
      level: 35,
      damage: 40,
      behavior: 'passive',
      dialogue: [
        'Thí nghiệm của tôi đã thất bại thảm hại...',
        'Quái Vật "Mẹ" là kết quả của sai lầm kinh hoàng nhất.',
        'Ngươi phải có nhóm mạnh mẽ để đối đầu nó.'
      ],
      experience: 0
    });

    const sinhVatThiNghiemLoi = await AgentSchema.create({
      name: 'Sinh Vật Thí Nghiệm Lỗi',
      description: 'Sinh vật lai tạo thất bại. Nhiều chi, nhiều đầu, di chuyển kỳ dị.',
      type: 'mob',
      currentRoomId: phongLab2._id,
      hp: 280,
      maxHp: 280,
      level: 32,
      damage: 38,
      behavior: 'aggressive',
      loot: [],
      experience: 240,
      agentType: 'mob',
      lootTable: [
        { itemId: moDotBienLon._id, dropChance: 0.7 },
        { itemId: tinhTheNangLuong._id, dropChance: 0.3 }
      ]
    });

    const bongMaKhoaHocGia = await AgentSchema.create({
      name: 'Bóng Ma Khoa Học Gia',
      description: 'Linh hồn khoa học gia chết trong thảm họa. Phát sáng xanh lạnh, xuyên qua vật thể.',
      type: 'mob',
      currentRoomId: phongLab1._id,
      hp: 250,
      maxHp: 250,
      level: 37,
      damage: 42,
      behavior: 'wander',
      loot: [],
      experience: 280,
      agentType: 'mob',
      lootTable: [
        { itemId: tinhTheNangLuong._id, dropChance: 0.6 },
        { itemId: moDotBienLon._id, dropChance: 0.4 }
      ]
    });

    const quaiVatMe = await AgentSchema.create({
      name: 'Quái Vật "Mẹ"',
      description: 'Sinh vật đột biến khổng lồ, là mẹ của tất cả thí nghiệm lỗi. Cơ thể khổng lồ, nhiều xúc tu.',
      type: 'mob',
      currentRoomId: phongLabBoss._id,
      hp: 1200,
      maxHp: 1200,
      level: 40,
      damage: 65,
      behavior: 'aggressive',
      loot: [],
      experience: 800,
      agentType: 'boss',
      mechanics: ['summon_minions', 'acid_spit', 'regeneration'],
      lootTable: [
        { itemId: traiTimDotBienOnDinh._id, dropChance: 1.0 }, // 100% boss drop
        { itemId: moDotBienLon._id, dropChance: 0.95 },
        { itemId: tinhTheNangLuong._id, dropChance: 0.95 }
      ]
    });

    // Phase 22: Zone 5 NPCs and Mobs (Level 40-50)
    const thaySuCoNgu = await AgentSchema.create({
      name: 'Thầy Tu Cổ Ngữ',
      description: 'Thầy tu già canh giữ Citadel. Áo choàng xanh lam, tỏa hào quang thánh thiện.',
      type: 'npc',
      currentRoomId: loiVaoTrungTam._id,
      hp: 600,
      maxHp: 600,
      level: 45,
      damage: 60,
      behavior: 'passive',
      dialogue: [
        'Trung Tâm này là nơi thiêng liêng cuối cùng.',
        'Vệ Binh Cổ Ngữ chỉ để yên những ai xứng đáng.',
        'Kẻ Cai Quản là thử thách cuối cùng của ngươi.'
      ],
      experience: 0
    });

    const veBinhCoNgu = await AgentSchema.create({
      name: 'Vệ Binh Cổ Ngữ',
      description: 'Chiến binh cổ đại bằng năng lượng tinh khiết. Giáp phát sáng, kiếm năng lượng sắc bén.',
      type: 'mob',
      currentRoomId: trungTam1._id,
      hp: 400,
      maxHp: 400,
      level: 43,
      damage: 55,
      behavior: 'patrol',
      patrolRoute: [trungTam1._id, trungTam2._id],
      loot: [],
      experience: 380,
      agentType: 'elite',
      lootTable: [
        { itemId: nangLuongTinhKhiet._id, dropChance: 0.7 },
        { itemId: loiHoVeCoDai._id, dropChance: 0.1 }
      ]
    });

    const phapSuVongTich = await AgentSchema.create({
      name: 'Pháp Sư Vong Tích',
      description: 'Pháp sư cổ đại với sức mạnh phép thuật khủng khiếp. Tay cầm quyển sách cổ phát sáng.',
      type: 'mob',
      currentRoomId: trungTam2._id,
      hp: 350,
      maxHp: 350,
      level: 47,
      damage: 70,
      behavior: 'aggressive',
      loot: [],
      experience: 420,
      agentType: 'elite',
      lootTable: [
        { itemId: nangLuongTinhKhiet._id, dropChance: 0.8 },
        { itemId: loiHoVeCoDai._id, dropChance: 0.15 }
      ]
    });

    const keCaiQuanCoNgu = await AgentSchema.create({
      name: 'Kẻ Cai Quản Cổ Ngữ',
      description: 'Người cai quản tối thượng của Citadel. Hào quang vàng bao trùm, sức mạnh áp đảo.',
      type: 'mob',
      currentRoomId: trungTamBoss._id,
      hp: 2000,
      maxHp: 2000,
      level: 50,
      damage: 90,
      behavior: 'aggressive',
      loot: [],
      experience: 1500,
      agentType: 'boss',
      mechanics: ['ancient_magic', 'time_slow', 'summon_guardians', 'ultimate_blast'],
      lootTable: [
        { itemId: nuocMatCuaThanhCu._id, dropChance: 1.0 }, // 100% boss drop
        { itemId: nangLuongTinhKhiet._id, dropChance: 0.99 },
        { itemId: loiHoVeCoDai._id, dropChance: 0.5 }
      ]
    });

    // Add agents to rooms
    // Zone 1
    cổngThành.agents.push(linhGac._id, giaLang._id);
    khuCho.agents.push(thuongGia._id, thuongGiaBiAn._id);
    hẻmTối.agents.push(chuotBienDi._id, chuotCong._id);
    rừngRậm.agents.push(sóiRừng._id, thayMaYeu._id, keCuopDuong._id);
    hang.agents.push(goblin._id, thuLinhKeCuop._id); // Phase 26: Added Level 10 boss
    quảngTrường.agents.push(linhTuần._id);
    sânLuyệnTập.agents.push(huấnLuyệnViên._id);
    phòngKhóTreasure.agents.push(phùThủy._id);

    // Zone 2
    loiVaoHamNgam.agents.push(thoSanPheLieu._id);
    hamNgam2.agents.push(nhenDotBien._id);
    hamNgam4.agents.push(nguoiCongNgam._id);
    hamNgamBoss.agents.push(robotQuanLyCong._id);
    
    // Populate sewer rooms with monsters
    for (let i = 0; i < sewerRooms.length; i++) {
      // Add Nhện Đột Biến and Người Cống Ngầm to sewer rooms
      if (i % 2 === 0) {
        // Create Nhện Đột Biến instance
        const spider = await AgentSchema.create({
          name: 'Nhện Đột Biến',
          description: 'Nhện khổng lồ với nhiều mắt đỏ rực. Nọc độc nhỏ giọt từ nanh.',
          type: 'mob',
          currentRoomId: sewerRooms[i]._id,
          hp: 120,
          maxHp: 120,
          level: 12,
          damage: 15,
          behavior: 'aggressive',
          loot: [],
          experience: 80,
          agentType: 'mob',
          lootTable: [
            { itemId: voNhenCung._id, dropChance: 0.6 },
            { itemId: loiNangLuongYeu._id, dropChance: 0.3 }
          ]
        });
        sewerRooms[i].agents.push(spider._id);
      } else {
        // Create Người Cống Ngầm instance
        const sewerperson = await AgentSchema.create({
          name: 'Người Cống Ngầm',
          description: 'Sinh vật nhân hình biến dạng sống trong hầm ngầm. Da xanh nhợt nhạt.',
          type: 'mob',
          currentRoomId: sewerRooms[i]._id,
          hp: 150,
          maxHp: 150,
          level: 16,
          damage: 20,
          behavior: 'aggressive',
          loot: [],
          experience: 120,
          agentType: 'mob',
          lootTable: [
            { itemId: voNhenCung._id, dropChance: 0.5 },
            { itemId: loiNangLuongYeu._id, dropChance: 0.4 }
          ]
        });
        sewerRooms[i].agents.push(sewerperson._id);
      }
      await sewerRooms[i].save();
    }

    // Zone 3
    loiVaoNhaMay.agents.push(kySuTruongCu._id);
    nhaMay2.agents.push(robotBaoVeRiSet._id);
    nhaMay3.agents.push(congNhanBienDi._id);
    nhaMayBoss.agents.push(robotSatThuMau01._id);
    
    // Populate factory rooms with monsters
    for (let i = 0; i < factoryRooms.length; i++) {
      if (i % 2 === 0) {
        // Create Robot Bảo Vệ Rỉ Sét instance
        const robot = await AgentSchema.create({
          name: 'Robot Bảo Vệ Rỉ Sét',
          description: 'Robot bảo vệ cũ kỹ, rỉ sét nhưng vẫn hoạt động. Vũ khí đã lỗi thời.',
          type: 'mob',
          currentRoomId: factoryRooms[i]._id,
          hp: 180,
          maxHp: 180,
          level: 22,
          damage: 25,
          behavior: 'patrol',
          patrolRoute: [factoryRooms[i]._id],
          loot: [],
          experience: 150,
          agentType: 'mob',
          lootTable: [
            { itemId: banhRangRiSet._id, dropChance: 0.7 },
            { itemId: loiNangLuongYeu._id, dropChance: 0.4 }
          ]
        });
        factoryRooms[i].agents.push(robot._id);
      } else {
        // Create Công Nhân Biến Dị instance
        const mutantWorker = await AgentSchema.create({
          name: 'Công Nhân Biến Dị',
          description: 'Công nhân bị đột biến bởi hóa chất. Thân hình biến dạng, mắt trống rỗng.',
          type: 'mob',
          currentRoomId: factoryRooms[i]._id,
          hp: 220,
          maxHp: 220,
          level: 26,
          damage: 30,
          behavior: 'wander',
          loot: [],
          experience: 180,
          agentType: 'mob',
          lootTable: [
            { itemId: moDotBienNho._id, dropChance: 0.7 },
            { itemId: banhRangRiSet._id, dropChance: 0.3 }
          ]
        });
        factoryRooms[i].agents.push(mutantWorker._id);
      }
      await factoryRooms[i].save();
    }

    // Zone 4
    loiVaoPhongLab.agents.push(giaoSuBiAn._id);
    phongLab1.agents.push(bongMaKhoaHocGia._id);
    phongLab2.agents.push(sinhVatThiNghiemLoi._id);
    phongLabBoss.agents.push(quaiVatMe._id);
    
    // Populate lab rooms with monsters
    for (let i = 0; i < labRooms.length; i++) {
      if (i % 2 === 0) {
        // Create Sinh Vật Thí Nghiệm Lỗi instance
        const experiment = await AgentSchema.create({
          name: 'Sinh Vật Thí Nghiệm Lỗi',
          description: 'Sinh vật lai tạo thất bại. Nhiều chi, nhiều đầu, di chuyển kỳ dị.',
          type: 'mob',
          currentRoomId: labRooms[i]._id,
          hp: 280,
          maxHp: 280,
          level: 32,
          damage: 38,
          behavior: 'aggressive',
          loot: [],
          experience: 240,
          agentType: 'mob',
          lootTable: [
            { itemId: moDotBienLon._id, dropChance: 0.7 },
            { itemId: tinhTheNangLuong._id, dropChance: 0.3 }
          ]
        });
        labRooms[i].agents.push(experiment._id);
      } else {
        // Create Bóng Ma Khoa Học Gia instance
        const ghost = await AgentSchema.create({
          name: 'Bóng Ma Khoa Học Gia',
          description: 'Linh hồn khoa học gia chết trong thảm họa. Phát sáng xanh lạnh, xuyên qua vật thể.',
          type: 'mob',
          currentRoomId: labRooms[i]._id,
          hp: 250,
          maxHp: 250,
          level: 37,
          damage: 42,
          behavior: 'wander',
          loot: [],
          experience: 280,
          agentType: 'mob',
          lootTable: [
            { itemId: tinhTheNangLuong._id, dropChance: 0.6 },
            { itemId: moDotBienLon._id, dropChance: 0.4 }
          ]
        });
        labRooms[i].agents.push(ghost._id);
      }
      await labRooms[i].save();
    }

    // Zone 5
    loiVaoTrungTam.agents.push(thaySuCoNgu._id);
    trungTam1.agents.push(veBinhCoNgu._id);
    trungTam2.agents.push(phapSuVongTich._id);
    trungTamBoss.agents.push(keCaiQuanCoNgu._id);
    
    // Populate citadel rooms with elite monsters
    for (let i = 0; i < citadelRooms.length; i++) {
      if (i % 2 === 0) {
        // Create Vệ Binh Cổ Ngữ instance
        const guardian = await AgentSchema.create({
          name: 'Vệ Binh Cổ Ngữ',
          description: 'Chiến binh cổ đại bằng năng lượng tinh khiết. Giáp phát sáng, kiếm năng lượng sắc bén.',
          type: 'mob',
          currentRoomId: citadelRooms[i]._id,
          hp: 400,
          maxHp: 400,
          level: 43,
          damage: 55,
          behavior: 'patrol',
          patrolRoute: [citadelRooms[i]._id],
          loot: [],
          experience: 380,
          agentType: 'elite',
          lootTable: [
            { itemId: nangLuongTinhKhiet._id, dropChance: 0.7 },
            { itemId: loiHoVeCoDai._id, dropChance: 0.1 }
          ]
        });
        citadelRooms[i].agents.push(guardian._id);
      } else {
        // Create Pháp Sư Vong Tích instance
        const mage = await AgentSchema.create({
          name: 'Pháp Sư Vong Tích',
          description: 'Pháp sư cổ đại với sức mạnh phép thuật khủng khiếp. Tay cầm quyển sách cổ phát sáng.',
          type: 'mob',
          currentRoomId: citadelRooms[i]._id,
          hp: 350,
          maxHp: 350,
          level: 47,
          damage: 70,
          behavior: 'aggressive',
          loot: [],
          experience: 420,
          agentType: 'elite',
          lootTable: [
            { itemId: nangLuongTinhKhiet._id, dropChance: 0.8 },
            { itemId: loiHoVeCoDai._id, dropChance: 0.15 }
          ]
        });
        citadelRooms[i].agents.push(mage._id);
      }
      await citadelRooms[i].save();
    }

    // Save all rooms with agents
    await cổngThành.save();
    await khuCho.save();
    await hẻmTối.save();
    await rừngRậm.save();
    await hang.save();
    await quảngTrường.save();
    await sânLuyệnTập.save();
    await phòngKhóTreasure.save();
    
    await loiVaoHamNgam.save();
    await hamNgam2.save();
    await hamNgam4.save();
    await hamNgamBoss.save();
    
    await loiVaoNhaMay.save();
    await nhaMay2.save();
    await nhaMay3.save();
    await nhaMayBoss.save();
    
    await loiVaoPhongLab.save();
    await phongLab1.save();
    await phongLab2.save();
    await phongLabBoss.save();
    
    await loiVaoTrungTam.save();
    await trungTam1.save();
    await trungTam2.save();
    await trungTamBoss.save();

    // Phase 22: Create Quests for all zones
    // Zone 1 Quests (Level 1-10) - Tutorial quests from Già Làng
    await QuestSchema.create({
      name: 'Tiêu diệt 10 Chuột Cống',
      description: 'Già Làng muốn bạn tiêu diệt 10 con Chuột Cống trong Hẻm Tối.',
      type: 'main',
      questGiver: 'Già Làng',
      questGiverRoomId: cổngThành._id,
      objectives: [{ type: 'kill', target: 'Chuột Cống', count: 10, progress: 0 }],
      rewards: { exp: 100, gold: 20 },
      levelRequirement: 1,
      isRepeatable: false,
      active: true
    });

    await QuestSchema.create({
      name: 'Nói chuyện với Thợ Rèn',
      description: 'Già Làng muốn bạn đi nói chuyện với Thợ Rèn ở Khu Chợ.',
      type: 'main',
      questGiver: 'Già Làng',
      questGiverRoomId: cổngThành._id,
      objectives: [{ type: 'talk', target: 'Thợ Rèn', count: 1, progress: 0 }],
      rewards: { exp: 50, gold: 10 },
      levelRequirement: 1,
      isRepeatable: false,
      active: true
    });

    await QuestSchema.create({
      name: 'Thu thập 5 Vải Rách',
      description: 'Thu thập 5 Vải Rách từ Thây Ma Yếu.',
      type: 'side',
      questGiver: 'Già Làng',
      questGiverRoomId: cổngThành._id,
      objectives: [{ type: 'collect', target: 'Vải Rách', count: 5, progress: 0 }],
      rewards: { exp: 80, gold: 15 },
      levelRequirement: 3,
      isRepeatable: false,
      active: true
    });

    await QuestSchema.create({
      name: 'Tiêu diệt Kẻ Cướp Đường',
      description: 'Tiêu diệt 5 Kẻ Cướp Đường để bảo vệ người dân.',
      type: 'side',
      questGiver: 'Lính Gác',
      questGiverRoomId: cổngThành._id,
      objectives: [{ type: 'kill', target: 'Kẻ Cướp Đường', count: 5, progress: 0 }],
      rewards: { exp: 200, gold: 50 },
      levelRequirement: 6,
      isRepeatable: false,
      active: true
    });

    // Zone 2 Quests (Level 10-20) - Grinding quests from Thợ Săn Phế Liệu
    await QuestSchema.create({
      name: 'Thu thập 20 Vỏ Nhện Cứng',
      description: 'Thợ Săn Phế Liệu cần 20 Vỏ Nhện Cứng để chế tạo giáp.',
      type: 'side',
      questGiver: 'Thợ Săn Phế Liệu',
      questGiverRoomId: loiVaoHamNgam._id,
      objectives: [{ type: 'collect', target: 'Vỏ Nhện Cứng', count: 20, progress: 0 }],
      rewards: { exp: 400, gold: 100 },
      levelRequirement: 11,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: 'Tiêu diệt 30 Người Cống Ngầm',
      description: 'Làm sạch hầm ngầm bằng cách tiêu diệt 30 Người Cống Ngầm.',
      type: 'side',
      questGiver: 'Thợ Săn Phế Liệu',
      questGiverRoomId: loiVaoHamNgam._id,
      objectives: [{ type: 'kill', target: 'Người Cống Ngầm', count: 30, progress: 0 }],
      rewards: { exp: 600, gold: 150 },
      levelRequirement: 15,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: 'Đánh bại Robot Quản Lý Cống',
      description: 'Tiêu diệt Robot Quản Lý Cống để kiếm Lõi Cổ Ngữ Hỏng.',
      type: 'main',
      questGiver: 'Thợ Săn Phế Liệu',
      questGiverRoomId: loiVaoHamNgam._id,
      objectives: [{ type: 'kill', target: 'Robot Quản Lý Cống', count: 1, progress: 0 }],
      rewards: { exp: 1000, gold: 300 },
      levelRequirement: 18,
      isRepeatable: false,
      active: true
    });

    // Zone 3 Quests (Level 20-30) - From Kỹ Sư Trưởng Cũ
    await QuestSchema.create({
      name: 'Thu thập 30 Bánh Răng Rỉ Sét',
      description: 'Kỹ Sư Trưởng Cũ cần 30 Bánh Răng để sửa chữa thiết bị.',
      type: 'side',
      questGiver: 'Kỹ Sư Trưởng Cũ',
      questGiverRoomId: loiVaoNhaMay._id,
      objectives: [{ type: 'collect', target: 'Bánh Răng Rỉ Sét', count: 30, progress: 0 }],
      rewards: { exp: 800, gold: 200 },
      levelRequirement: 21,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: 'Thu thập 15 Mô Đột Biến Nhỏ',
      description: 'Thu thập 15 Mô Đột Biến Nhỏ từ Công Nhân Biến Dị.',
      type: 'side',
      questGiver: 'Kỹ Sư Trưởng Cũ',
      questGiverRoomId: loiVaoNhaMay._id,
      objectives: [{ type: 'collect', target: 'Mô Đột Biến Nhỏ', count: 15, progress: 0 }],
      rewards: { exp: 1000, gold: 250 },
      levelRequirement: 25,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: 'Đánh bại Robot Sát Thủ Mẫu 01',
      description: 'Tiêu diệt Robot Sát Thủ Mẫu 01 để lấy Chip Vi Mạch Cổ.',
      type: 'main',
      questGiver: 'Kỹ Sư Trưởng Cũ',
      questGiverRoomId: loiVaoNhaMay._id,
      objectives: [{ type: 'kill', target: 'Robot Sát Thủ Mẫu 01', count: 1, progress: 0 }],
      rewards: { exp: 2000, gold: 500 },
      levelRequirement: 28,
      isRepeatable: false,
      active: true
    });

    // Zone 4 Quests (Level 30-40) - From Giáo Sư Bí Ẩn
    await QuestSchema.create({
      name: 'Tìm 3 Mảnh Dữ Liệu',
      description: 'Thu thập 3 Tinh Thể Năng Lượng chứa dữ liệu thí nghiệm.',
      type: 'side',
      questGiver: 'Giáo Sư Bí Ẩn',
      questGiverRoomId: loiVaoPhongLab._id,
      objectives: [{ type: 'collect', target: 'Tinh Thể Năng Lượng', count: 3, progress: 0 }],
      rewards: { exp: 1500, gold: 400 },
      levelRequirement: 31,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: '[Nhóm] Tiêu diệt Quái Vật "Mẹ"',
      description: 'Tập hợp nhóm để tiêu diệt Quái Vật "Mẹ". Nhiệm vụ rất nguy hiểm!',
      type: 'main',
      questGiver: 'Giáo Sư Bí Ẩn',
      questGiverRoomId: loiVaoPhongLab._id,
      objectives: [{ type: 'kill', target: 'Quái Vật "Mẹ"', count: 1, progress: 0 }],
      rewards: { exp: 3500, gold: 800 },
      levelRequirement: 38,
      isRepeatable: false,
      active: true
    });

    // Zone 5 Quests (Level 40-50) - Daily quests from Thầy Tu Cổ Ngữ
    await QuestSchema.create({
      name: '[Hàng ngày] Tiêu diệt 10 Vệ Binh Cổ Ngữ',
      description: 'Nhiệm vụ hàng ngày: Tiêu diệt 10 Vệ Binh Cổ Ngữ.',
      type: 'daily',
      questGiver: 'Thầy Tu Cổ Ngữ',
      questGiverRoomId: loiVaoTrungTam._id,
      objectives: [{ type: 'kill', target: 'Vệ Binh Cổ Ngữ', count: 10, progress: 0 }],
      rewards: { exp: 2500, gold: 600 },
      levelRequirement: 41,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: '[Hàng ngày] Thu thập 5 Năng Lượng Tinh Khiết',
      description: 'Nhiệm vụ hàng ngày: Thu thập 5 Năng Lượng Tinh Khiết.',
      type: 'daily',
      questGiver: 'Thầy Tu Cổ Ngữ',
      questGiverRoomId: loiVaoTrungTam._id,
      objectives: [{ type: 'collect', target: 'Năng Lượng Tinh Khiết', count: 5, progress: 0 }],
      rewards: { exp: 2000, gold: 500 },
      levelRequirement: 40,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: '[Nhóm] Đánh bại Kẻ Cai Quản Cổ Ngữ',
      description: 'Thử thách cuối cùng: Tập hợp nhóm mạnh nhất để đánh bại Kẻ Cai Quản Cổ Ngữ.',
      type: 'main',
      questGiver: 'Thầy Tu Cổ Ngữ',
      questGiverRoomId: loiVaoTrungTam._id,
      objectives: [{ type: 'kill', target: 'Kẻ Cai Quản Cổ Ngữ', count: 1, progress: 0 }],
      rewards: { exp: 5000, gold: 1500 },
      levelRequirement: 48,
      isRepeatable: false,
      active: true
    });

    // Enhancement System: Daily Quests with upgrade material rewards
    await QuestSchema.create({
      name: '[Hàng Ngày] Săn Boss',
      description: 'Tiêu diệt 3 Boss bất kỳ để nhận thưởng.',
      type: 'daily',
      questGiver: 'Thợ Rèn',
      questGiverRoomId: khuCho._id,
      objectives: [
        { type: 'kill', target: 'Thủ Lĩnh Goblin', count: 1, progress: 0 }
      ],
      rewards: { 
        exp: 500, 
        gold: 200,
        items: [daCuongHoaCap1._id, daCuongHoaCap1._id] // 2x Enhancement Stones
      },
      levelRequirement: 10,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: '[Hàng Ngày] Thu Thập Nguyên Liệu',
      description: 'Thu thập 20 vật liệu chế tạo bất kỳ.',
      type: 'daily',
      questGiver: 'Thợ Rèn',
      questGiverRoomId: khuCho._id,
      objectives: [
        { type: 'collect', target: 'Da Chuột', count: 20, progress: 0 }
      ],
      rewards: { 
        exp: 300, 
        gold: 150,
        items: [daTinhLuyen._id] // 1x Refine Stone
      },
      levelRequirement: 5,
      isRepeatable: true,
      active: true
    });

    await QuestSchema.create({
      name: '[Hàng Tuần] Chinh Phục Hầm Ngục',
      description: 'Hoàn thành 10 tầng hầm ngục trong tuần.',
      type: 'daily',
      questGiver: 'Thương Nhân Hầm Ngục',
      questGiverRoomId: dungeonLobby._id,
      objectives: [
        { type: 'visit', target: 'Hầm Ngục - Phòng Chiến', count: 10, progress: 0 }
      ],
      rewards: { 
        exp: 1000, 
        gold: 500,
        items: [daNangSaoSoCap._id, daTinhLuyen._id] // Star Stone + Refine Stone
      },
      levelRequirement: 15,
      isRepeatable: true,
      active: true
    });

    console.log('World initialized successfully!');
    console.log(`- Created ${await RoomSchema.countDocuments()} rooms`);
    console.log(`- Created ${await ItemSchema.countDocuments()} items`);
    console.log(`- Created ${await AgentSchema.countDocuments()} agents`);
    console.log(`- Created ${await QuestSchema.countDocuments()} quests`);
    
    return {
      startingRoomId: cổngThành._id
    };
  } catch (error) {
    console.error('Error initializing world:', error);
    throw error;
  }
}
