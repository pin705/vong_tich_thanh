export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkSession, isAuthenticated } = useAuth();
  
  // Check session on first load
  if (!isAuthenticated.value) {
    await checkSession();
  }
  
  // Redirect to game if already authenticated
  if (isAuthenticated.value) {
    return navigateTo('/');
  }
});
