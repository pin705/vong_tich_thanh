export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkSession, isAuthenticated } = useAuth();
  const { loggedIn } = useUserSession();
  
  // // Check session on first load
  // if (!loggedIn.value) {
  //   await checkSession();
  // }
  
  // Redirect to login if not authenticated
  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});
