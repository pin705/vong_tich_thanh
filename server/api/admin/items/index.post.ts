import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Create new item
    const item = await ItemSchema.create(body);

    return {
      success: true,
      message: `Đã tạo vật phẩm: ${item.name}`,
      item: {
        id: item._id,
        name: item.name,
        type: item.type
      }
    };
  } catch (error: any) {
    console.error('Error creating item:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create item'
    });
  }
});
