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

    const body = await readBody(event);

    const item = await ItemSchema.findByIdAndUpdate(
      itemId,
      body,
      { new: true, runValidators: true }
    );

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Item not found'
      });
    }

    return {
      success: true,
      message: `Đã cập nhật vật phẩm: ${item.name}`,
      item: {
        id: item._id,
        name: item.name,
        type: item.type
      }
    };
  } catch (error: any) {
    console.error('Error updating item:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update item'
    });
  }
});
