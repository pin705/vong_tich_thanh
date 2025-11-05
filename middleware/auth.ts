export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkSession, isAuthenticated } = useAuth();
  
  // Check session on first load
  if (!isAuthenticated.value) {
    await checkSession();
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }
});
