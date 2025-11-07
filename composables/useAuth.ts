export const useAuth = () => {
  const { loggedIn, user, clear } = useUserSession();
  const isAuthenticated = computed(() => loggedIn.value);

  const login = async (username: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      
      if (response.success && response.player) {
        // Session is set by the server, just return success
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { username, password }
      });
      
      if (response.success && response.player) {
        // Session is set by the server, just return success
        return { success: true };
      }
      
      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clear();
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout
  };
};
