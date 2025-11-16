import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface CreateTestCustomerRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  initial_points?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authorization required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the admin token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Invalid authorization token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("supabase_user_id", user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body: CreateTestCustomerRequest = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      initial_points = 2000,
    } = body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, first_name, and last_name are required",
        },
        { status: 400 }
      );
    }

    // Step 1: Create Supabase Auth user
    const { data: authUser, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for testing
        user_metadata: {
          first_name,
          last_name,
          phone,
        },
      });

    if (createAuthError || !authUser.user) {
      console.error("Error creating auth user:", createAuthError);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to create auth user: ${createAuthError?.message}`,
        },
        { status: 500 }
      );
    }

    // Step 2: Create app_users record
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from("app_users")
      .insert({
        id: authUser.user.id, // Use same ID as auth user for consistency
        email,
        first_name,
        last_name,
        phone,
        is_verified: true, // Auto-verify for testing
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appUserError) {
      console.error("Error creating app user:", appUserError);
      // Cleanup: Delete the auth user if app_users creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to create app user: ${appUserError.message}`,
        },
        { status: 500 }
      );
    }

    // Step 3: Get available shops to create loyalty accounts
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from("shops")
      .select("id, name, customer_id, loyalty_type, points_per_euro")
      .eq("status", "active")
      .limit(5); // Limit to first 5 active shops for testing

    if (shopsError) {
      console.error("Error fetching shops:", shopsError);
    }

    const loyaltyAccounts = [];

    // Step 4: Create loyalty accounts for each shop
    if (shops && shops.length > 0) {
      for (const shop of shops) {
        // Get or create loyalty program for the shop
        let { data: loyaltyProgram, error: loyaltyProgramError } =
          await supabaseAdmin
            .from("loyalty_programs")
            .select("*")
            .eq("shop_id", shop.id)
            .eq("type", shop.loyalty_type || "points")
            .eq("is_active", true)
            .single();

        // Create loyalty program if it doesn't exist
        if (loyaltyProgramError && loyaltyProgramError.code === "PGRST116") {
          const { data: newLoyaltyProgram, error: createProgramError } =
            await supabaseAdmin
              .from("loyalty_programs")
              .insert({
                shop_id: shop.id,
                type: shop.loyalty_type || "points",
                name: `${shop.name} Loyalty Program`,
                description: `Earn points for purchases at ${shop.name}`,
                points_per_euro: shop.points_per_euro || 100,
                is_active: true,
              })
              .select()
              .single();

          if (createProgramError) {
            console.error(
              "Error creating loyalty program:",
              createProgramError
            );
            continue; // Skip this shop
          }
          loyaltyProgram = newLoyaltyProgram;
        } else if (loyaltyProgramError) {
          console.error("Error fetching loyalty program:", loyaltyProgramError);
          continue; // Skip this shop
        }

        // Create customer loyalty account
        const { data: loyaltyAccount, error: loyaltyAccountError } =
          await supabaseAdmin
            .from("customer_loyalty_accounts")
            .insert({
              app_user_id: appUser.id,
              shop_id: shop.id,
              loyalty_program_id: loyaltyProgram!.id,
              points_balance: initial_points,
              stamps_count: 0,
              visits_count: 0,
              total_spent: 0,
              is_active: true,
            })
            .select()
            .single();

        if (loyaltyAccountError) {
          console.error("Error creating loyalty account:", loyaltyAccountError);
        } else {
          loyaltyAccounts.push({
            shop_id: shop.id,
            shop_name: shop.name,
            points_balance: initial_points,
            loyalty_account_id: loyaltyAccount.id,
          });
        }
      }
    }

    // Step 5: Generate a session for the test customer (optional, for easier testing)
    const { data: session, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          }/dashboard`,
        },
      });

    const response = {
      success: true,
      message: "Test customer created successfully",
      data: {
        customer: {
          id: appUser.id,
          email: appUser.email,
          first_name: appUser.first_name,
          last_name: appUser.last_name,
          phone: appUser.phone,
          supabase_user_id: authUser.user.id,
          is_verified: appUser.is_verified,
        },
        auth_info: {
          user_id: authUser.user.id,
          email,
          // Don't return the password in response for security
        },
        loyalty_accounts: loyaltyAccounts,
        usage_instructions: {
          login: `Use email: ${email}, password: ${password}`,
          api_testing:
            "Sign in with Supabase client using the credentials above to get JWT token",
          points_available: initial_points,
          shops_available: loyaltyAccounts.length,
        },
        test_links: session?.properties?.action_link
          ? {
              magic_link: session.properties.action_link,
              note: "Use this magic link for quick login (expires in 1 hour)",
            }
          : undefined,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in create-test-customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


