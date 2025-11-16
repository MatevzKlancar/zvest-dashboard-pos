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

// Generate redemption ID in format: A12-345
function generateRedemptionId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = letters.charAt(Math.floor(Math.random() * letters.length));
  const numbers1 = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  const numbers2 = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${letter}${numbers1}-${numbers2}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
): Promise<NextResponse> {
  try {
    const { couponId } = await params;

    // Verify customer authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the customer token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get customer from app_users table
    const { data: customer, error: customerError } = await supabase
      .from("app_users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    // Get coupon details
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select(
        `
        *,
        shop:shops(id, name, status)
      `
      )
      .eq("id", couponId)
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found or not available" },
        { status: 404 }
      );
    }

    // Check if coupon has expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Coupon has expired" },
        { status: 400 }
      );
    }

    // Get customer's loyalty account for this shop
    const { data: loyaltyAccount, error: loyaltyError } = await supabase
      .from("customer_loyalty_accounts")
      .select("*")
      .eq("app_user_id", customer.id)
      .eq("shop_id", coupon.shop_id)
      .eq("is_active", true)
      .single();

    if (loyaltyError || !loyaltyAccount) {
      return NextResponse.json(
        { success: false, message: "No loyalty account found for this shop" },
        { status: 400 }
      );
    }

    // Check if customer has enough points
    if (loyaltyAccount.points_balance < coupon.points_required) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient loyalty points",
          data: {
            points_required: coupon.points_required,
            points_available: loyaltyAccount.points_balance,
            points_needed:
              coupon.points_required - loyaltyAccount.points_balance,
          },
        },
        { status: 400 }
      );
    }

    // Generate unique redemption ID
    let redemptionId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      redemptionId = generateRedemptionId();
      attempts++;

      // Check if this ID already exists
      const { data: existingRedemption } = await supabase
        .from("coupon_redemptions")
        .select("id")
        .eq("id", redemptionId)
        .single();

      if (!existingRedemption) break;

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique redemption ID");
      }
    } while (attempts < maxAttempts);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Start transaction: Create redemption and update loyalty account
    const { error: redemptionError } = await supabase
      .from("coupon_redemptions")
      .insert({
        id: redemptionId,
        coupon_id: couponId,
        app_user_id: customer.id,
        points_deducted: coupon.points_required,
        discount_applied: 0, // Will be set when POS validates
        redeemed_at: new Date().toISOString(),
        status: "active", // Active until used or expired
      })
      .select()
      .single();

    if (redemptionError) {
      console.error("Error creating coupon redemption:", redemptionError);
      return NextResponse.json(
        { success: false, message: "Failed to activate coupon" },
        { status: 500 }
      );
    }

    // Update loyalty account points
    const newPointsBalance =
      loyaltyAccount.points_balance - coupon.points_required;
    const { error: updatePointsError } = await supabase
      .from("customer_loyalty_accounts")
      .update({
        points_balance: newPointsBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loyaltyAccount.id);

    if (updatePointsError) {
      console.error("Error updating loyalty points:", updatePointsError);
      // Rollback: Delete the redemption
      await supabase.from("coupon_redemptions").delete().eq("id", redemptionId);

      return NextResponse.json(
        { success: false, message: "Failed to deduct loyalty points" },
        { status: 500 }
      );
    }

    // Parse articles data
    let articlesData: unknown[] = [];
    try {
      articlesData =
        typeof coupon.articles_data === "string"
          ? JSON.parse(coupon.articles_data)
          : coupon.articles_data;
    } catch (e) {
      console.error("Error parsing articles_data:", e);
      articlesData = [];
    }

    const response = {
      success: true,
      message: "Coupon activated successfully",
      data: {
        redemption_id: redemptionId,
        qr_code_data: redemptionId, // QR code contains the redemption ID
        coupon: {
          id: coupon.id,
          type: coupon.type,
          name: coupon.name,
          description: coupon.description,
          articles: articlesData,
        },
        customer: {
          email: customer.email,
          points_balance_before: loyaltyAccount.points_balance,
          points_balance_after: newPointsBalance,
          points_redeemed: coupon.points_required,
        },
        shop: {
          id: coupon.shop.id,
          name: coupon.shop.name,
        },
        expires_at: expiresAt.toISOString(),
        valid_for_minutes: 5,
        usage_instructions: `Show QR code or tell staff: "${redemptionId}" (6 digits) - Valid for 5 minutes`,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in coupon activation:", error);
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


