export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn } = useUserSession();
  
  // Redirect to game if already authenticated
  if (loggedIn.value) {
    return navigateTo('/');
  }
});
