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

    // Get all mail for the player, sorted by creation date (newest first)
    const mails = await MailSchema.find({ recipientId: playerId })
      .populate('attachedItems.itemId')
      .sort({ createdAt: -1 })
      .lean();

    // Format mail data
    const formattedMails = mails.map((mail: any) => ({
      id: mail._id.toString(),
      senderName: mail.senderName,
      subject: mail.subject,
      body: mail.body,
      isRead: mail.isRead,
      attachedItems: mail.attachedItems.map((item: any) => ({
        id: item.itemId?._id?.toString(),
        name: item.itemId?.name || 'Unknown Item',
        quantity: item.quantity
      })),
      attachedGold: mail.attachedGold,
      attachedPremium: mail.attachedPremium,
      hasAttachments: mail.attachedItems.length > 0 || mail.attachedGold > 0 || mail.attachedPremium > 0,
      expiresAt: mail.expiresAt,
      createdAt: mail.createdAt
    }));

    return {
      success: true,
      mails: formattedMails
    };
  } catch (error) {
    console.error('Error loading mail inbox:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load mail inbox'
    });
  }
});
