import { ItemSchema } from '../../../models/Item';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  try {
    // Get all items that are recipes
    const recipes = await ItemSchema.find({ 
      type: 'recipe',
      craftingRecipe: { $exists: true }
    });

    return {
      success: true,
      recipes: recipes.map((recipe: any) => ({
        id: recipe._id,
        name: recipe.name,
        description: recipe.description,
        materials: recipe.craftingRecipe?.materials || [],
        result: recipe.craftingRecipe?.result || null
      }))
    };
  } catch (error) {
    console.error('Error getting recipes:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi khi lấy danh sách công thức.'
    });
  }
});
