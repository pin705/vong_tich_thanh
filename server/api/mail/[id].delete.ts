import { MailSchema } from '~/models/Mail';

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
        statusMessage: 'Bạn không có quyền xóa thư này.'
      });
    }

    // Check if there are unclaimed attachments
    if (mail.attachedItems.length > 0 || mail.attachedGold > 0 || mail.attachedPremium > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn phải nhận thưởng trước khi xóa thư này.'
      });
    }

    // Delete mail
    await MailSchema.findByIdAndDelete(mailId);

    return {
      success: true,
      message: 'Đã xóa thư.'
    };
  } catch (error: any) {
    console.error('Error deleting mail:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete mail'
    });
  }
});
