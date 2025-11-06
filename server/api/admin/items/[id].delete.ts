import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      });
    }

    const itemId = getRouterParam(event, 'id');
    if (!itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Item ID is required'
      });
    }

    const item = await ItemSchema.findByIdAndDelete(itemId);

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Item not found'
      });
    }

    return {
      success: true,
      message: `Đã xóa vật phẩm: ${item.name}`
    };
  } catch (error: any) {
    console.error('Error deleting item:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete item'
    });
  }
});
