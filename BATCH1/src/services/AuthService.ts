import { supabase } from '../lib/supabase';

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  phone?: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export class AuthService {
  static async signUp(signupData: SignupData): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase is not configured. Please set up your database connection.',
        error: 'SUPABASE_NOT_CONFIGURED'
      };
    }

    try {
      const { email, password, fullName, businessName, phone } = signupData;

      if (!email || !password || !fullName || !businessName) {
        return {
          success: false,
          message: 'All required fields must be filled',
          error: 'MISSING_FIELDS'
        };
      }

      if (password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long',
          error: 'WEAK_PASSWORD'
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address',
          error: 'INVALID_EMAIL'
        };
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            phone: phone || null
          },
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          return {
            success: false,
            message: 'This email is already registered. Please login instead.',
            error: 'EMAIL_EXISTS'
          };
        }

        return {
          success: false,
          message: signUpError.message,
          error: signUpError
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user account',
          error: 'USER_CREATION_FAILED'
        };
      }

      const userId = authData.user.id;

      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: businessName,
          business_name: businessName,
          email: email,
          phone: phone || null,
          subscription_tier: 'basic',
          subscription_status: 'active',
          subscription_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          max_users: 3,
          max_products: 1000,
          is_active: true
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
      }

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          role: 'owner',
          phone: phone || null,
          email_verified: false,
          is_active: true
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
      }

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'basic',
          status: 'trial',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          trial_days_used: 0,
          max_systems: 3,
          max_phones: 1,
          features: {
            pos: true,
            inventory: true,
            customers: true,
            basicReporting: true
          },
          amount_paid: 0,
          payment_reference: ''
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
      }

      return {
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        data: authData
      };

    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred during signup',
        error
      };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase is not configured',
        error: 'SUPABASE_NOT_CONFIGURED'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            message: 'Invalid email or password',
            error: 'INVALID_CREDENTIALS'
          };
        }

        return {
          success: false,
          message: error.message,
          error
        };
      }

      if (!data.user) {
        return {
          success: false,
          message: 'Login failed',
          error: 'LOGIN_FAILED'
        };
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: data.user,
          session: data.session,
          profile: userProfile
        }
      };

    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred during login',
        error
      };
    }
  }

  static async signOut(): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase is not configured',
        error: 'SUPABASE_NOT_CONFIGURED'
      };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          message: error.message,
          error
        };
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred during logout',
        error
      };
    }
  }

  static async requestPasswordReset(email: string): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase is not configured',
        error: 'SUPABASE_NOT_CONFIGURED'
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return {
          success: false,
          message: error.message,
          error
        };
      }

      return {
        success: true,
        message: 'Password reset link sent to your email'
      };

    } catch (error: any) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error
      };
    }
  }

  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase is not configured',
        error: 'SUPABASE_NOT_CONFIGURED'
      };
    }

    try {
      if (newPassword.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long',
          error: 'WEAK_PASSWORD'
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          message: error.message,
          error
        };
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };

    } catch (error: any) {
      console.error('Password update error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error
      };
    }
  }

  static async getCurrentUser() {
    if (!supabase) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async getSession() {
    if (!supabase) {
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  static validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one uppercase letter'
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one lowercase letter'
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one number'
      };
    }

    return {
      valid: true,
      message: 'Password is strong'
    };
  }

  static getPasswordStrength(password: string): { strength: 'weak' | 'fair' | 'good' | 'strong'; score: number } {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { strength: 'weak', score };
    if (score <= 3) return { strength: 'fair', score };
    if (score <= 4) return { strength: 'good', score };
    return { strength: 'strong', score };
  }
}
