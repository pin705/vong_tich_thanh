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

    const playerId = session.user.id;
    const mailId = getRouterParam(event, 'id');

    if (!mailId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mail ID is required'
      });
    }

    // Find mail
    const mail = await MailSchema.findById(mailId);
    if (!mail) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Thư không tồn tại.'
      });
    }

    // Verify ownership
    if (mail.recipientId.toString() !== playerId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Bạn không có quyền đọc thư này.'
      });
    }

    // Mark as read
    if (!mail.isRead) {
      mail.isRead = true;
      await mail.save();

      // Update player's unread mail indicator
      const unreadCount = await MailSchema.countDocuments({ 
        recipientId: playerId, 
        isRead: false 
      });

      await PlayerSchema.findByIdAndUpdate(playerId, {
        hasUnreadMail: unreadCount > 0
      });
    }

    return {
      success: true,
      message: 'Đã đánh dấu thư đã đọc.'
    };
  } catch (error: any) {
    console.error('Error marking mail as read:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to mark mail as read'
    });
  }
});
