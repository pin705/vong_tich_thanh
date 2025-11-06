import { AgentSchema } from '~/models/Agent';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const vendorId = getRouterParam(event, 'id');
    if (!vendorId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vendor ID is required'
      });
    }

    // Get vendor/agent with populated shop inventory
    const vendor = await AgentSchema.findById(vendorId)
      .populate('shopInventory')
      .lean();

    if (!vendor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Vendor not found'
      });
    }

    if (!vendor.isVendor) {
      return {
        success: false,
        message: 'This agent is not a vendor'
      };
    }

    const shopInventory = vendor.shopInventory || [];

    return {
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        shopType: vendor.shopType || 'gold'
      },
      items: shopInventory.map((item: any) => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        type: item.type,
        price: item.price,
        sellValue: item.sellValue,
        premiumPrice: item.premiumPrice,
        quality: item.quality,
        requiredLevel: item.requiredLevel,
        effects: item.effects,
        stats: item.stats
      }))
    };
  } catch (error: any) {
    console.error('Error fetching vendor shop:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch vendor shop'
    });
  }
});
