import type { Command } from '~/types';

export function handleCommand(command: Command, playerId: string): string[] {
  const { action, target, args } = command;
  const responses: string[] = [];

  switch (action) {
    case 'help':
      responses.push('');
      responses.push('═══════════════════════════════════════════════════');
      responses.push('            DANH SÁCH LỆNH                         ');
      responses.push('═══════════════════════════════════════════════════');
      responses.push('');
      responses.push('DI CHUYỂN:');
      responses.push('  go [hướng] hoặc [n/s/e/w/u/d]');
      responses.push('  Ví dụ: go bắc, n, s, e, w');
      responses.push('');
      responses.push('QUAN SÁT:');
      responses.push('  look [đối tượng]    (l)  - Quan sát phòng/vật/người');
      responses.push('  inventory           (i)  - Xem túi đồ');
      responses.push('');
      responses.push('TƯƠNG TÁC:');
      responses.push('  talk [tên]          (t)  - Nói chuyện với NPC');
      responses.push('  say [text]               - Nói với người chơi khác');
      responses.push('  get [vật]           (g)  - Nhặt vật phẩm');
      responses.push('  drop [vật]               - Thả vật phẩm');
      responses.push('  use [vật]                - Sử dụng vật phẩm');
      responses.push('');
      responses.push('CHIẾN ĐẤU:');
      responses.push('  attack [tên]        (a)  - Tấn công mục tiêu');
      responses.push('  flee                     - Bỏ chạy khỏi chiến đấu');
      responses.push('');
      responses.push('MUA BÁN:');
      responses.push('  list                     - Xem hàng hóa');
      responses.push('  buy [vật]                - Mua vật phẩm');
      responses.push('  sell [vật]               - Bán vật phẩm');
      responses.push('');
      responses.push('KHÁC:');
      responses.push('  help                     - Hiển thị trợ giúp');
      responses.push('  quit                     - Thoát game');
      responses.push('');
      break;

    case 'look':
    case 'l':
      if (!target) {
        // Look at room (default)
        responses.push('[Cổng Thành Cũ]');
        responses.push('Bạn đang đứng trước một cổng thành bằng đá đã sụp đổ một nửa.');
        responses.push('Rêu và dây leo phủ kín. Gió rít qua những khe hở.');
        responses.push('');
        responses.push('Lối ra: [bắc]');
        responses.push('Một [Lính Gác] đang đứng đây.');
      } else {
        // Look at specific target
        if (target.includes('lính') || target.includes('gác')) {
          responses.push('Người lính gác trông mệt mỏi. Áo giáp của anh ta đã rỉ sét và');
          responses.push('anh ta dựa vào một cây giáo cũ. Anh ta có vẻ không muốn bị làm phiền.');
        } else {
          responses.push(`Bạn không thấy "${target}" ở đây.`);
        }
      }
      break;

    case 'go':
      if (!target) {
        responses.push('Bạn muốn đi hướng nào? (bắc/nam/đông/tây)');
      } else if (['bắc', 'north', 'n'].includes(target)) {
        responses.push('Bạn đi về phía bắc...');
        responses.push('');
        responses.push('[Khu Chợ]');
        responses.push('Một khu chợ nhỏ với vài gian hàng đang mở cửa. Mùi thức ăn');
        responses.push('và tiếng người qua lại tạo nên không khí sôi động.');
        responses.push('');
        responses.push('Lối ra: [nam]');
        responses.push('Một [Thương Gia] đang đứng ở gian hàng.');
      } else {
        responses.push('Bạn không thể đi theo hướng đó.');
      }
      break;

    case 'talk':
    case 't':
      if (!target) {
        responses.push('Bạn muốn nói chuyện với ai?');
      } else if (target.includes('lính') || target.includes('gác')) {
        responses.push('[Lính Gác] càu nhàu: "Đừng gây rối. Nếu muốn tìm việc,');
        responses.push('đến khu chợ tìm [Thương Gia]."');
      } else if (target.includes('thương') || target.includes('gia')) {
        responses.push('[Thương Gia] mỉm cười: "Chào mừng! Gõ \'list\' để xem hàng');
        responses.push('của tôi. Tôi có đồ tốt đây!"');
      } else {
        responses.push(`Bạn không thấy "${target}" ở đây để nói chuyện.`);
      }
      break;

    case 'say':
      if (!target && (!args || args.length === 0)) {
        responses.push('Bạn muốn nói gì?');
      } else {
        const message = [target, ...(args || [])].filter(Boolean).join(' ');
        responses.push(`Bạn nói: "${message}"`);
      }
      break;

    case 'attack':
    case 'a':
      if (!target) {
        responses.push('Bạn muốn tấn công ai?');
      } else {
        responses.push(`Bạn không thể tấn công "${target}" ở đây.`);
        responses.push('(Tính năng chiến đấu đang được phát triển)');
      }
      break;

    case 'inventory':
    case 'i':
      responses.push('════════════ TÚI ĐỒ ════════════');
      responses.push('Túi đồ của bạn trống.');
      responses.push('═════════════════════════════════');
      break;

    case 'get':
    case 'g':
      if (!target) {
        responses.push('Bạn muốn nhặt gì?');
      } else {
        responses.push(`Không có "${target}" ở đây để nhặt.`);
      }
      break;

    case 'list':
      responses.push('════════ HÀNG CỦA THƯƠNG GIA ════════');
      responses.push('1. [Bình Máu Nhỏ]  - 10 vàng');
      responses.push('2. [Kiếm Gỉ]       - 25 vàng');
      responses.push('3. [Áo Da]         - 30 vàng');
      responses.push('═══════════════════════════════════════');
      responses.push('Gõ \'buy [tên vật phẩm]\' để mua.');
      break;

    case 'buy':
      if (!target) {
        responses.push('Bạn muốn mua gì?');
      } else {
        responses.push(`(Tính năng mua bán đang được phát triển)`);
        responses.push(`Bạn chưa có đủ vàng để mua "${target}".`);
      }
      break;

    case '':
      // Empty command - do nothing
      break;

    case 'quit':
      responses.push('Tạm biệt! Hẹn gặp lại.');
      break;

    default:
      responses.push(`Lệnh không hợp lệ: "${action}"`);
      responses.push('Gõ "help" để xem danh sách lệnh.');
      break;
  }

  return responses;
}
