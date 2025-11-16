import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// GET /api/shop-admin/shop - Get shop information
export async function GET(request: NextRequest) {
  try {
    // Verify shop admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authorization required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // For testing purposes, we'll use a simplified shop lookup
    // In production, you'd verify the JWT token and get the shop from the authenticated user

    // Get first active shop for testing (in production, filter by authenticated shop owner)
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select(
        `
        *,
        customer:customers(id, name, type),
        pos_provider:pos_providers(id, name)
      `
      )
      .eq("status", "active")
      .limit(1)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { success: false, message: "Shop not found" },
        { status: 404 }
      );
    }

    // Get loyalty program for the shop
    const { data: loyaltyProgram, error: loyaltyError } = await supabase
      .from("loyalty_programs")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("is_active", true)
      .single();

    // Get shop statistics
    const { data: stats, error: statsError } = await supabase
      .from("customer_loyalty_accounts")
      .select("id, points_balance, total_spent")
      .eq("shop_id", shop.id)
      .eq("is_active", true);

    let shopStats = {
      total_customers: 0,
      total_points_distributed: 0,
      total_revenue: 0,
    };

    if (!statsError && stats) {
      shopStats = {
        total_customers: stats.length,
        total_points_distributed: stats.reduce(
          (sum, account) => sum + account.points_balance,
          0
        ),
        total_revenue: stats.reduce(
          (sum, account) => sum + parseFloat(account.total_spent || "0"),
          0
        ),
      };
    }

    const response = {
      success: true,
      data: {
        ...shop,
        loyalty_program: loyaltyProgram,
        stats: shopStats,
        settings:
          typeof shop.settings === "string"
            ? JSON.parse(shop.settings)
            : shop.settings,
        social_media:
          typeof shop.social_media === "string"
            ? JSON.parse(shop.social_media)
            : shop.social_media,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET shop:", error);
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


