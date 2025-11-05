export const useAuth = () => {
  const user = useState<{ id: string; username: string } | null>('user', () => null);
  const isAuthenticated = computed(() => !!user.value);

  const login = async (username: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      
      if (response.success && response.player) {
        user.value = {
          id: response.player.id,
          username: response.player.username
        };
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
        user.value = {
          id: response.player.id,
          username: response.player.username
        };
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
      user.value = null;
    }
  };

  const checkSession = async () => {
    try {
      const response = await $fetch('/api/auth/session');
      if (response.authenticated && response.user) {
        user.value = response.user;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  };

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    register,
    logout,
    checkSession
  };
};
