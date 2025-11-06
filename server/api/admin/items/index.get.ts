import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    // Get all items
    const items = await ItemSchema.find({}).lean();

    return {
      success: true,
      items: items.map((item: any) => ({
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        type: item.type,
        rarity: item.rarity,
        price: item.price,
        value: item.value
      }))
    };
  } catch (error) {
    console.error('Error loading items:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load items'
    });
  }
});
