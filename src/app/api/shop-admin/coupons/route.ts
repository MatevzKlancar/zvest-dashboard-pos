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

interface CreateCouponRequest {
  type: "percentage" | "fixed";
  name: string;
  description?: string;
  points_required: number;
  articles: Array<{
    article_id: string | null;
    article_name: string;
    discount_value: number;
  }>;
  expires_at?: string;
  is_active?: boolean;
}

// GET /api/shop-admin/coupons - Get all coupons for a shop
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

    // Get all active shops for testing (in production, filter by authenticated shop owner)
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id, name")
      .eq("status", "active")
      .limit(1); // Get first active shop for testing

    if (shopsError || !shops || shops.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active shops found" },
        { status: 404 }
      );
    }

    const shopId = shops[0].id;

    // Get coupons for the shop
    const { data: coupons, error: couponsError } = await supabase
      .from("coupons")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (couponsError) {
      console.error("Error fetching coupons:", couponsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch coupons" },
        { status: 500 }
      );
    }

    // Parse articles_data for each coupon
    const formattedCoupons = coupons.map((coupon) => {
      let articles = [];
      try {
        articles =
          typeof coupon.articles_data === "string"
            ? JSON.parse(coupon.articles_data)
            : coupon.articles_data || [];
      } catch (e) {
        console.error(
          "Error parsing articles_data for coupon",
          coupon.id,
          ":",
          e
        );
        articles = [];
      }

      return {
        ...coupon,
        articles,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedCoupons,
    });
  } catch (error) {
    console.error("Error in GET coupons:", error);
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

// POST /api/shop-admin/coupons - Create a new coupon
export async function POST(request: NextRequest) {
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
    // Get first active shop for testing (in production, get shop from authenticated user)
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id, name")
      .eq("status", "active")
      .limit(1);

    if (shopsError || !shops || shops.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active shops found" },
        { status: 404 }
      );
    }

    const shopId = shops[0].id;

    const body: CreateCouponRequest = await request.json();
    const {
      type,
      name,
      description,
      points_required,
      articles,
      expires_at,
      is_active = true,
    } = body;

    // Validate required fields
    if (
      !type ||
      !name ||
      !points_required ||
      !articles ||
      articles.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Type, name, points_required, and articles are required",
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!["percentage", "fixed"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Type must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    // Validate points_required
    if (points_required < 0) {
      return NextResponse.json(
        { success: false, message: "Points required must be non-negative" },
        { status: 400 }
      );
    }

    // Validate articles
    for (const article of articles) {
      if (
        !article.article_name ||
        typeof article.discount_value !== "number" ||
        article.discount_value < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Each article must have a name and non-negative discount_value",
          },
          { status: 400 }
        );
      }

      // Additional validation for percentage discounts
      if (type === "percentage" && article.discount_value > 100) {
        return NextResponse.json(
          { success: false, message: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }
    }

    // Create the coupon
    const couponData = {
      shop_id: shopId,
      type,
      name,
      description: description || null,
      points_required,
      articles_data: JSON.stringify(articles),
      expires_at: expires_at || null,
      is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .insert(couponData)
      .select()
      .single();

    if (couponError) {
      console.error("Error creating coupon:", couponError);
      return NextResponse.json(
        { success: false, message: "Failed to create coupon" },
        { status: 500 }
      );
    }

    // Return the created coupon with parsed articles
    const response = {
      success: true,
      message: "Coupon created successfully",
      data: {
        ...coupon,
        articles,
        shop: {
          id: shopId,
          name: shops[0].name,
        },
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in POST coupons:", error);
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


