export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  
  if (!session || !session.user) {
    return {
      authenticated: false
    };
  }

  return {
    authenticated: true,
    user: session.user
  };
});
