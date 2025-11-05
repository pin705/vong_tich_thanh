import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    // Get all items with premium price > 0
    const premiumItems = await ItemSchema.find({ 
      premiumPrice: { $gt: 0 } 
    }).lean();

    return {
      success: true,
      items: premiumItems.map(item => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        type: item.type,
        premiumPrice: item.premiumPrice,
        effects: item.effects
      }))
    };
  } catch (error) {
    console.error('Error fetching premium shop items:', error);
    return {
      success: false,
      message: 'Failed to fetch premium shop items'
    };
  }
});
