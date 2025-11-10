import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { SkillSchema } from '../../models/Skill';

/**
 * Handle skill-related commands (skill equip, skill use, skill list)
 */
export async function handleSkillCommand(command: Command, playerId: string): Promise<string[]> {
  const { action, target, args } = command;
  const responses: string[] = [];

  try {
    const player = await PlayerSchema.findById(playerId)
      .populate('skills')
      .populate('equippedSkills');
    
    if (!player) {
      responses.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return responses;
    }

    switch (action) {
      case 'skill': {
        if (!target) {
          // Show equipped skills
          responses.push('═══════════════════════════════════');
          responses.push('         KỸ NĂNG ĐÃ TRANG BỊ      ');
          responses.push('═══════════════════════════════════');
          
          if (!player.equippedSkills || player.equippedSkills.size === 0) {
            responses.push('Bạn chưa trang bị kỹ năng nào.');
            responses.push('');
            responses.push('Sử dụng: skill equip [số slot] [tên kỹ năng]');
            responses.push('Ví dụ: skill equip 1 Chém Ngang');
          } else {
            const equippedSkills = player.equippedSkills;
            for (let i = 1; i <= 10; i++) {
              const skillId = equippedSkills.get(i.toString());
              if (skillId) {
                const skill = await SkillSchema.findById(skillId);
                if (skill) {
                  const cooldownInfo = player.skillCooldowns?.get(skillId.toString());
                  const isOnCooldown = cooldownInfo && new Date(cooldownInfo) > new Date();
                  const cooldownText = isOnCooldown ? ' [CD]' : '';
                  responses.push(`[${i}] ${skill.name}${cooldownText} - ${skill.description}`);
                }
              } else {
                responses.push(`[${i}] (Trống)`);
              }
            }
          }
          responses.push('═══════════════════════════════════');
          responses.push('Sử dụng: [số slot] để kích hoạt kỹ năng');
          responses.push('Ví dụ: 1 (kích hoạt kỹ năng ở slot 1)');
          break;
        }

        if (target === 'equip') {
          // skill equip [slot] [skill name]
          if (!args || args.length < 2) {
            responses.push('Sử dụng: skill equip [số slot 1-10] [tên kỹ năng]');
            responses.push('Ví dụ: skill equip 1 Chém Ngang');
            break;
          }

          const slot = parseInt(args[0]);
          if (isNaN(slot) || slot < 1 || slot > 10) {
            responses.push('Slot phải từ 1 đến 10.');
            break;
          }

          const skillName = args.slice(1).join(' ');
          const skill = await SkillSchema.findOne({
            _id: { $in: player.skills },
            name: new RegExp(skillName, 'i')
          });

          if (!skill) {
            responses.push(`Bạn chưa học kỹ năng [${skillName}].`);
            responses.push('Sử dụng lệnh "skills" để xem danh sách kỹ năng đã học.');
            break;
          }

          // Only active skills can be equipped
          if (skill.type !== 'active') {
            responses.push(`[${skill.name}] là kỹ năng bị động, không thể trang bị vào hotbar.`);
            break;
          }

          // Initialize equippedSkills if not exists
          if (!player.equippedSkills) {
            player.equippedSkills = new Map();
          }

          // Equip skill to slot
          player.equippedSkills.set(slot.toString(), skill._id);
          await player.save();

          responses.push(`Đã trang bị [${skill.name}] vào slot ${slot}.`);
          responses.push(`Sử dụng lệnh "${slot}" để kích hoạt kỹ năng này trong chiến đấu.`);
          break;
        }

        if (target === 'unequip') {
          // skill unequip [slot]
          if (!args || args.length < 1) {
            responses.push('Sử dụng: skill unequip [số slot 1-10]');
            break;
          }

          const slot = parseInt(args[0]);
          if (isNaN(slot) || slot < 1 || slot > 10) {
            responses.push('Slot phải từ 1 đến 10.');
            break;
          }

          if (!player.equippedSkills || !player.equippedSkills.has(slot.toString())) {
            responses.push(`Slot ${slot} không có kỹ năng nào.`);
            break;
          }

          const skillId = player.equippedSkills.get(slot.toString());
          const skill = await SkillSchema.findById(skillId);
          player.equippedSkills.delete(slot.toString());
          await player.save();

          responses.push(`Đã gỡ [${skill?.name || 'kỹ năng'}] khỏi slot ${slot}.`);
          break;
        }

        if (target === 'list') {
          // Show all learned skills
          if (!player.skills || player.skills.length === 0) {
            responses.push('Bạn chưa học kỹ năng nào.');
            break;
          }

          const skills = await SkillSchema.find({ _id: { $in: player.skills } });
          responses.push('═══════════════════════════════════');
          responses.push('         KỸ NĂNG ĐÃ HỌC          ');
          responses.push('═══════════════════════════════════');
          
          skills.forEach((skill: any, index: number) => {
            const typeIcon = skill.type === 'passive' ? '🛡️' : '⚔️';
            const equippedSlot = Array.from(player.equippedSkills?.entries() || [])
              .find(([_, id]) => id.toString() === skill._id.toString())?.[0];
            const equippedText = equippedSlot ? ` [Slot ${equippedSlot}]` : '';
            
            responses.push(`${index + 1}. ${typeIcon} [${skill.name}]${equippedText}`);
            responses.push(`   ${skill.description}`);
            responses.push(`   Loại: ${skill.type === 'passive' ? 'Bị động' : 'Chủ động'}`);
            if (skill.type === 'active') {
              responses.push(`   Tiêu hao: ${skill.resourceCost || 0} MP | Hồi chiêu: ${skill.cooldown || 0}s`);
            }
            responses.push('');
          });
          responses.push('═══════════════════════════════════');
          break;
        }

        responses.push('Lệnh không hợp lệ. Sử dụng: skill [equip/unequip/list]');
        break;
      }

      default:
        // Check if it's a number (skill slot activation)
        const slotNum = parseInt(action);
        if (!isNaN(slotNum) && slotNum >= 1 && slotNum <= 10) {
          // Activate skill in slot
          if (!player.inCombat) {
            responses.push('Bạn chỉ có thể sử dụng kỹ năng trong chiến đấu.');
            break;
          }

          if (!player.equippedSkills || !player.equippedSkills.has(slotNum.toString())) {
            responses.push(`Slot ${slotNum} không có kỹ năng nào.`);
            break;
          }

          const skillId = player.equippedSkills.get(slotNum.toString());
          const skill = await SkillSchema.findById(skillId);
          
          if (!skill) {
            responses.push('Lỗi: Không tìm thấy kỹ năng.');
            break;
          }

          // Check cooldown
          const cooldownInfo = player.skillCooldowns?.get(skillId.toString());
          if (cooldownInfo && new Date(cooldownInfo) > new Date()) {
            const remainingSeconds = Math.ceil((new Date(cooldownInfo).getTime() - Date.now()) / 1000);
            responses.push(`[${skill.name}] đang hồi chiêu. (Còn ${remainingSeconds}s)`);
            break;
          }

          // Check resource cost
          if (skill.resourceCost > player.mp) {
            responses.push(`Không đủ MP để sử dụng [${skill.name}]. (Cần ${skill.resourceCost} MP)`);
            break;
          }

          // Use skill through combat system
          const { useSkillInCombat } = await import('../utils/combatSystem');
          const skillResult = await useSkillInCombat(playerId, skill._id.toString());
          
          if (skillResult.success) {
            responses.push(...skillResult.messages);
          } else {
            responses.push(skillResult.message || 'Không thể sử dụng kỹ năng.');
          }
          break;
        }

        responses.push('Lệnh không hợp lệ. Gõ "skill" để xem hướng dẫn.');
        break;
    }

  } catch (error) {
    console.error('Error in skill command:', error);
    responses.push('Lỗi khi xử lý lệnh kỹ năng.');
  }

  return responses;
}
