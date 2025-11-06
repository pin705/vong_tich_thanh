/**
 * Help system for game commands
 */

export interface HelpTopic {
  title: string;
  description: string;
  commands: Array<{
    command: string;
    aliases?: string[];
    description: string;
    examples?: string[];
  }>;
}

export const helpTopics: Record<string, HelpTopic> = {
  movement: {
    title: 'DI CHUYỂN (MOVEMENT)',
    description: 'Di chuyển giữa các phòng trong thế giới game.',
    commands: [
      {
        command: 'go [hướng]',
        aliases: ['n', 's', 'e', 'w', 'u', 'd', 'bắc', 'nam', 'đông', 'tây', 'lên', 'xuống'],
        description: 'Di chuyển theo hướng chỉ định',
        examples: [
          'go bắc - Di chuyển về phía bắc',
          'n - Tắt gọn: đi về phía bắc',
          'e - Tắt gọn: đi về phía đông'
        ]
      }
    ]
  },
  
  observation: {
    title: 'QUAN SÁT (OBSERVATION)',
    description: 'Xem và kiểm tra môi trường xung quanh.',
    commands: [
      {
        command: 'look [đối tượng]',
        aliases: ['l'],
        description: 'Xem mô tả phòng hoặc đối tượng cụ thể',
        examples: [
          'look - Xem mô tả phòng hiện tại',
          'l chuột - Xem thông tin về con chuột',
          'look người chơi - Xem thông tin người chơi khác'
        ]
      },
      {
        command: 'inventory',
        aliases: ['i', 'inv'],
        description: 'Xem túi đồ của bạn',
        examples: ['inventory', 'i']
      }
    ]
  },
  
  interaction: {
    title: 'TƯƠNG TÁC (INTERACTION)',
    description: 'Tương tác với vật phẩm, NPC và người chơi.',
    commands: [
      {
        command: 'talk [tên]',
        aliases: ['t'],
        description: 'Nói chuyện với NPC',
        examples: [
          'talk lính gác',
          't thương gia'
        ]
      },
      {
        command: 'say [tin nhắn]',
        description: 'Nói với người chơi trong cùng phòng',
        examples: [
          'say Xin chào mọi người!',
          'say Có ai muốn tổ đội không?'
        ]
      },
      {
        command: 'get [vật phẩm]',
        aliases: ['g'],
        description: 'Nhặt vật phẩm từ mặt đất',
        examples: [
          'get kiếm',
          'g bình máu'
        ]
      },
      {
        command: 'drop [vật phẩm]',
        description: 'Thả vật phẩm xuống đất',
        examples: [
          'drop đuôi chuột',
          'drop vật phẩm không cần'
        ]
      },
      {
        command: 'use [vật phẩm]',
        description: 'Sử dụng vật phẩm (thuốc, đồ ăn, v.v.)',
        examples: [
          'use bình máu',
          'use bình máu nhỏ'
        ]
      }
    ]
  },
  
  combat: {
    title: 'CHIẾN ĐẤU (COMBAT)',
    description: 'Hệ thống chiến đấu tự động với quái vật và người chơi.',
    commands: [
      {
        command: 'attack [tên]',
        aliases: ['a', 'kill'],
        description: 'Tấn công mục tiêu (quái hoặc người chơi)',
        examples: [
          'attack chuột',
          'a goblin',
          'kill người chơi (cần bật PvP)'
        ]
      },
      {
        command: 'flee',
        aliases: ['run'],
        description: 'Bỏ chạy khỏi chiến đấu (60% thành công)',
        examples: [
          'flee',
          'run'
        ]
      },
      {
        command: 'pvp [on/off]',
        description: 'Bật/tắt chế độ PvP để chiến đấu với người chơi',
        examples: [
          'pvp on - Bật PvP',
          'pvp off - Tắt PvP'
        ]
      }
    ]
  },
  
  trading: {
    title: 'MUA BÁN & GIAO DỊCH',
    description: 'Mua bán với NPC và giao dịch với người chơi.',
    commands: [
      {
        command: 'list',
        description: 'Xem hàng hóa của thương nhân',
        examples: ['list']
      },
      {
        command: 'buy [vật phẩm]',
        description: 'Mua vật phẩm từ thương nhân',
        examples: [
          'buy bình máu',
          'buy kiếm gỉ'
        ]
      },
      {
        command: 'sell [vật phẩm]',
        description: 'Bán vật phẩm cho thương nhân (50% giá trị)',
        examples: [
          'sell đuôi chuột',
          'sell vật phẩm không cần'
        ]
      },
      {
        command: 'trade invite [tên]',
        description: 'Mời người chơi giao dịch trực tiếp',
        examples: ['trade invite NguoiChoi']
      },
      {
        command: 'trade add [vật phẩm]',
        description: 'Thêm vật phẩm vào giao dịch',
        examples: ['trade add kiếm thép']
      },
      {
        command: 'trade gold [số]',
        description: 'Thêm vàng vào giao dịch',
        examples: ['trade gold 100']
      }
    ]
  },
  
  party: {
    title: 'TỔ ĐỘI (PARTY)',
    description: 'Tạo nhóm và chiến đấu cùng nhau, chia sẻ kinh nghiệm.',
    commands: [
      {
        command: 'party invite [tên]',
        aliases: ['moi'],
        description: 'Mời người chơi vào nhóm',
        examples: [
          'party invite NguoiChoi',
          'moi NguoiChoi'
        ]
      },
      {
        command: 'party accept',
        description: 'Chấp nhận lời mời nhóm',
        examples: ['party accept']
      },
      {
        command: 'party leave',
        aliases: ['roi'],
        description: 'Rời khỏi nhóm',
        examples: [
          'party leave',
          'roi'
        ]
      },
      {
        command: '/p [tin nhắn]',
        aliases: ['p'],
        description: 'Chat với thành viên nhóm',
        examples: [
          '/p Tấn công boss nào!',
          'p Cần hỗ trợ!'
        ]
      }
    ]
  },
  
  guild: {
    title: 'BANG HỘI (GUILD)',
    description: 'Tham gia hoặc tạo bang hội, kho chung và chat bang.',
    commands: [
      {
        command: 'guild create [tên]',
        description: 'Tạo bang hội mới (tốn 1000 vàng)',
        examples: ['guild create Long Hổ Bang']
      },
      {
        command: 'guild invite [tên]',
        description: 'Mời người chơi vào bang',
        examples: ['guild invite NguoiChoi']
      },
      {
        command: 'guild deposit gold [số]',
        description: 'Gửi vàng vào kho bang',
        examples: ['guild deposit gold 500']
      },
      {
        command: '/g [tin nhắn]',
        aliases: ['g'],
        description: 'Chat với thành viên bang',
        examples: [
          '/g Chào mọi người!',
          'g Ai rảnh đi farm không?'
        ]
      }
    ]
  },
  
  alias: {
    title: 'LỆNH TẮT TÙY CHỈNH (ALIAS)',
    description: 'Tạo lệnh tắt riêng để gõ nhanh hơn.',
    commands: [
      {
        command: 'alias add [tên] [lệnh]',
        description: 'Tạo lệnh tắt mới',
        examples: [
          'alias add dn go north - Tạo lệnh "dn" cho "go north"',
          'alias add farm attack chuột - Tạo lệnh "farm" để tấn công chuột'
        ]
      },
      {
        command: 'alias remove [tên]',
        description: 'Xóa lệnh tắt',
        examples: ['alias remove dn']
      },
      {
        command: 'alias list',
        description: 'Xem danh sách lệnh tắt của bạn',
        examples: ['alias list']
      }
    ]
  }
};

export function getHelpText(topic?: string): string[] {
  const responses: string[] = [];
  
  if (!topic) {
    // Show general help
    responses.push('');
    responses.push('═══════════════════════════════════════════════════');
    responses.push('          HỆ THỐNG TRỢ GIÚP - VONG TÍCH THÀNH     ');
    responses.push('═══════════════════════════════════════════════════');
    responses.push('');
    responses.push('Gõ "help [chủ đề]" để xem hướng dẫn chi tiết:');
    responses.push('');
    responses.push('  help movement     - Di chuyển');
    responses.push('  help observation  - Quan sát');
    responses.push('  help interaction  - Tương tác');
    responses.push('  help combat       - Chiến đấu');
    responses.push('  help trading      - Mua bán & giao dịch');
    responses.push('  help party        - Tổ đội');
    responses.push('  help guild        - Bang hội');
    responses.push('  help alias        - Lệnh tắt tùy chỉnh');
    responses.push('');
    responses.push('MẸO CHƠI:');
    responses.push('  • Sử dụng lệnh tắt để gõ nhanh (n, s, e, w, a, i)');
    responses.push('  • Tạo alias riêng với lệnh "alias add"');
    responses.push('  • Tham gia party để chia sẻ kinh nghiệm');
    responses.push('  • Dùng "look [tên]" để xem thông tin quái vật trước khi đánh');
    responses.push('  • Bật PvP với "pvp on" nếu muốn chiến đấu với người chơi');
    responses.push('');
    
    return responses;
  }
  
  // Show specific topic
  const helpTopic = helpTopics[topic.toLowerCase()];
  
  if (!helpTopic) {
    responses.push(`Không tìm thấy chủ đề "${topic}".`);
    responses.push('Gõ "help" để xem danh sách chủ đề.');
    return responses;
  }
  
  responses.push('');
  responses.push('═══════════════════════════════════════════════════');
  responses.push(`  ${helpTopic.title}`);
  responses.push('═══════════════════════════════════════════════════');
  responses.push('');
  responses.push(helpTopic.description);
  responses.push('');
  
  for (const cmd of helpTopic.commands) {
    responses.push(`▸ ${cmd.command}`);
    
    if (cmd.aliases && cmd.aliases.length > 0) {
      responses.push(`  Tắt: ${cmd.aliases.join(', ')}`);
    }
    
    responses.push(`  ${cmd.description}`);
    
    if (cmd.examples && cmd.examples.length > 0) {
      responses.push('  Ví dụ:');
      for (const example of cmd.examples) {
        responses.push(`    ${example}`);
      }
    }
    
    responses.push('');
  }
  
  responses.push('Gõ "help" để xem danh sách tất cả chủ đề.');
  responses.push('');
  
  return responses;
}
