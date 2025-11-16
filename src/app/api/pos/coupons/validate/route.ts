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

interface ValidateRequest {
  shop_id: string;
  redemption_id: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify POS API key
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "POS API key required" },
        { status: 401 }
      );
    }

    // Verify POS provider exists and is active
    const { data: posProvider, error: posProviderError } = await supabase
      .from("pos_providers")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (posProviderError || !posProvider) {
      return NextResponse.json(
        { success: false, message: "Invalid POS API key" },
        { status: 401 }
      );
    }

    const body: ValidateRequest = await request.json();
    const { shop_id, redemption_id } = body;

    // Validate request format
    if (!shop_id || !redemption_id) {
      return NextResponse.json(
        { success: false, message: "shop_id and redemption_id are required" },
        { status: 400 }
      );
    }

    // Validate redemption_id format (A12-345)
    const redemptionIdRegex = /^[A-Z]\d{2}-\d{3}$/;
    if (!redemptionIdRegex.test(redemption_id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid redemption code format - must be 6 digits",
        },
        { status: 400 }
      );
    }

    // Verify shop belongs to this POS provider
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shop_id)
      .eq("pos_provider_id", posProvider.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        {
          success: false,
          message: "Shop not found or doesn't belong to this POS provider",
        },
        { status: 400 }
      );
    }

    // Get redemption details
    const { data: redemption, error: redemptionError } = await supabase
      .from("coupon_redemptions")
      .select(
        `
        *,
        coupon:coupons(
          id,
          name,
          description,
          type,
          articles_data,
          shop_id
        ),
        customer:app_users(
          id,
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("id", redemption_id)
      .single();

    if (redemptionError || !redemption) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or already used coupon redemption",
        },
        { status: 400 }
      );
    }

    // Check if redemption belongs to the correct shop
    if (redemption.coupon.shop_id !== shop_id) {
      return NextResponse.json(
        { success: false, message: "Coupon does not belong to this shop" },
        { status: 400 }
      );
    }

    // Check if redemption is still active
    if (redemption.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon redemption has already been used or cancelled",
        },
        { status: 400 }
      );
    }

    // Check if redemption has expired (5 minutes)
    const redemptionTime = new Date(redemption.redeemed_at);
    const expiryTime = new Date(redemptionTime.getTime() + 5 * 60 * 1000); // 5 minutes
    const now = new Date();

    if (now > expiryTime) {
      // Mark as expired
      await supabase
        .from("coupon_redemptions")
        .update({
          status: "expired",
          updated_at: now.toISOString(),
        })
        .eq("id", redemption_id);

      return NextResponse.json(
        { success: false, message: "Coupon redemption has expired" },
        { status: 400 }
      );
    }

    // Parse articles data
    let articlesData = [];
    try {
      articlesData =
        typeof redemption.coupon.articles_data === "string"
          ? JSON.parse(redemption.coupon.articles_data)
          : redemption.coupon.articles_data;
    } catch (e) {
      console.error("Error parsing articles_data:", e);
      articlesData = [];
    }

    // Mark redemption as used
    const { error: updateError } = await supabase
      .from("coupon_redemptions")
      .update({
        status: "used",
        updated_at: now.toISOString(),
      })
      .eq("id", redemption_id);

    if (updateError) {
      console.error("Error updating redemption status:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to process coupon redemption" },
        { status: 500 }
      );
    }

    // Calculate discount message for POS
    let discountMessage = "";
    let totalDiscountValue = 0;

    if (articlesData.length > 0) {
      const firstArticle = articlesData[0];
      if (redemption.coupon.type === "percentage") {
        if (firstArticle.article_id === null) {
          discountMessage = `Apply ${firstArticle.discount_value}% discount (applies to entire order)`;
        } else {
          discountMessage = `Apply ${firstArticle.discount_value}% discount to ${firstArticle.article_name}`;
        }
        totalDiscountValue = firstArticle.discount_value;
      } else if (redemption.coupon.type === "fixed") {
        if (firstArticle.article_id === null) {
          discountMessage = `Apply €${firstArticle.discount_value} discount (applies to entire order)`;
        } else {
          discountMessage = `Apply €${firstArticle.discount_value} discount to ${firstArticle.article_name}`;
        }
        totalDiscountValue = firstArticle.discount_value;
      }
    }

    const response = {
      success: true,
      message: `Coupon validated and redeemed successfully. ${discountMessage}`,
      data: {
        redemption_id: redemption_id,
        coupon: {
          id: redemption.coupon.id,
          name: redemption.coupon.name,
          description: redemption.coupon.description,
          type: redemption.coupon.type,
          articles: articlesData,
        },
        customer: {
          id: redemption.customer.id,
          email: redemption.customer.email,
          name: `${redemption.customer.first_name} ${redemption.customer.last_name}`,
        },
        shop: {
          id: shop.id,
          name: shop.name,
        },
        discount_info: {
          type: redemption.coupon.type,
          value: totalDiscountValue,
          message: discountMessage,
        },
        valid: true,
        redeemed_at: redemption.redeemed_at,
        validated_at: now.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in POS coupon validation:", error);
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


