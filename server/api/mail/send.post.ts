import { MailSchema } from '~/models/Mail';
import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }

    const senderId = session.user.id;
    const body = await readBody(event);
    const { recipientUsername, subject, message, attachedGold = 0 } = body;

    // Validate input
    if (!recipientUsername || !subject || !message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thiếu thông tin: người nhận, tiêu đề, hoặc nội dung.'
      });
    }

    // Get sender
    const sender = await PlayerSchema.findById(senderId);
    if (!sender) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thông tin người gửi.'
      });
    }

    // Find recipient
    const recipient = await PlayerSchema.findOne({ username: recipientUsername });
    if (!recipient) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy người chơi với tên này.'
      });
    }

    // Cannot send to self
    if (recipient._id.toString() === senderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn không thể gửi thư cho chính mình.'
      });
    }

    // Check if sender has enough gold (if attaching gold)
    if (attachedGold > 0) {
      if (sender.gold < attachedGold) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bạn không có đủ vàng để gửi.'
        });
      }
      
      // Deduct gold from sender
      sender.gold -= attachedGold;
      await sender.save();
    }

    // Create mail
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    await MailSchema.create({
      recipientId: recipient._id,
      senderName: sender.username,
      subject,
      body: message,
      attachedGold,
      expiresAt
    });

    // Update recipient's unread mail flag
    recipient.hasUnreadMail = true;
    await recipient.save();

    // Notify recipient if they are online
    try {
      const { notifyNewMail } = await import('~/server/routes/ws');
      notifyNewMail(recipient._id.toString());
    } catch (error) {
      // Player not online, notification will be shown when they log in
      console.log('Recipient not online, will see mail on next login');
    }

    return {
      success: true,
      message: `Đã gửi thư đến [${recipientUsername}].`
    };
  } catch (error: any) {
    console.error('Error sending mail:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send mail'
    });
  }
});
