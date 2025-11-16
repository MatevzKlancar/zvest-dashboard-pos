import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Get Supabase token for API calls
export const getSupabaseToken = async (): Promise<string | null> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Sign in with email and password
export const signInWithPassword = async (email: string, password: string) => {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({ email, password });
};

// Sign out
export const signOut = async () => {
  const supabase = createClient();
  return await supabase.auth.signOut();
};

// Complete shop setup
export const completeShopSetup = async (
  email: string,
  password: string,
  token: string,
  shopDetails?: {
    first_name?: string;
    last_name?: string;
    shop_name?: string;
    business_name?: string;
  }
) => {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        setup_token: token,
        user_type: "shop_owner",
        first_name: shopDetails?.first_name,
        last_name: shopDetails?.last_name,
        shop_name: shopDetails?.shop_name || shopDetails?.business_name,
        business_name: shopDetails?.business_name,
      },
    },
  });
};
