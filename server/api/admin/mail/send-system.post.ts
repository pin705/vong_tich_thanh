import { MailSchema } from '~/models/Mail';
import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { subject, message, rewards, recipientId } = body;

    // Validate input
    if (!subject || !message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thiếu tiêu đề hoặc nội dung thư.'
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    // If recipientId is null or 'all', send to all players
    if (!recipientId || recipientId === 'all') {
      // Get all players
      const allPlayers = await PlayerSchema.find({});
      
      // Create mail for each player
      for (const player of allPlayers) {
        await MailSchema.create({
          recipientId: player._id,
          senderName: 'Hệ Thống',
          subject,
          body: message,
          attachedItems: rewards?.items || [],
          attachedGold: rewards?.gold || 0,
          attachedPremium: rewards?.premium || 0,
          expiresAt
        });

        // Update player's unread mail flag
        player.hasUnreadMail = true;
        await player.save();

        // Notify player if online
        try {
          const { notifyNewMail } = await import('~/server/routes/ws');
          notifyNewMail(player._id.toString());
        } catch (error) {
          // Player not online
        }
      }

      return {
        success: true,
        message: `Đã gửi thư hệ thống đến ${allPlayers.length} người chơi.`
      };
    } else {
      // Send to specific player
      const player = await PlayerSchema.findById(recipientId);
      if (!player) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Không tìm thấy người chơi.'
        });
      }

      await MailSchema.create({
        recipientId: player._id,
        senderName: 'Hệ Thống',
        subject,
        body: message,
        attachedItems: rewards?.items || [],
        attachedGold: rewards?.gold || 0,
        attachedPremium: rewards?.premium || 0,
        expiresAt
      });

      // Update player's unread mail flag
      player.hasUnreadMail = true;
      await player.save();

      // Notify player if online
      try {
        const { notifyNewMail } = await import('~/server/routes/ws');
        notifyNewMail(player._id.toString());
      } catch (error) {
        // Player not online
      }

      return {
        success: true,
        message: `Đã gửi thư hệ thống đến [${player.username}].`
      };
    }
  } catch (error: any) {
    console.error('Error sending system mail:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send system mail'
    });
  }
});
