"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvitationDetails, useCompleteShopSetup } from "@/hooks/useAdmin";
import { Loader2, CheckCircle, AlertCircle, Store } from "lucide-react";
import { toast } from "sonner";

const setupSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    shop_details: z.object({
      description: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().url().optional().or(z.literal("")),
      opening_hours: z.string().optional(),
      loyalty_type: z.enum(["points", "coupons"]),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SetupFormData = z.infer<typeof setupSchema>;

export default function ShopSetupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [setupComplete, setSetupComplete] = useState(false);

  const {
    data: invitationData,
    isLoading: invitationLoading,
    error: invitationError,
  } = useInvitationDetails(token);
  const completeSetup = useCompleteShopSetup();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      shop_details: {
        description: "",
        address: "",
        phone: "",
        website: "",
        opening_hours: "",
        loyalty_type: "points",
      },
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  // Check if invitation is expired or invalid
  useEffect(() => {
    if (invitationData && invitationData.is_expired) {
      toast.error(
        "This invitation has expired. Please contact your administrator."
      );
    }
  }, [invitationData]);

  const onSubmit = async (data: SetupFormData) => {
    try {
      // First, complete the backend setup
      await completeSetup.mutateAsync({
        invitation_token: token,
        password: data.password,
        shop_details: data.shop_details,
      });

      // Then create the Supabase user account
      const { completeShopSetup } = await import("@/lib/auth");

      // Parse owner name into first and last name
      const ownerNameParts = invitationData?.owner_name?.split(" ") || [];
      const first_name = ownerNameParts[0] || "";
      const last_name = ownerNameParts.slice(1).join(" ") || "";

      const { error } = await completeShopSetup(
        invitationData?.owner_email || "",
        data.password,
        token,
        {
          first_name,
          last_name,
          shop_name: invitationData?.shop_name,
          business_name: invitationData?.shop_name,
        }
      );

      if (error) {
        throw new Error(`Account creation failed: ${error.message}`);
      }

      setSetupComplete(true);
      toast.success("Setup completed successfully!");
    } catch (error) {
      console.error("Setup error:", error);
      toast.error(error instanceof Error ? error.message : "Setup failed");
    }
  };

  // Show loading state
  if (invitationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Loading invitation...
          </h2>
        </div>
      </div>
    );
  }

  // Show error state
  if (invitationError || !invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invalid Invitation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This invitation link is invalid or has expired. Please contact your
            administrator for a new invitation.
          </p>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show expired state
  if (invitationData.is_expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invitation Expired
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This invitation has expired. Please contact your administrator for a
            new invitation.
          </p>
        </div>
      </div>
    );
  }

  // Show success state
  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Complete!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your shop account has been successfully created. You can now log in
            to your dashboard.
          </p>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">What&apos;s Next?</h3>
                  <ul className="mt-2 text-sm text-green-700 space-y-1">
                    <li>• Log in with your email and password</li>
                    <li>• Complete your shop profile</li>
                    <li>• Start creating loyalty campaigns</li>
                    <li>• Configure your POS integration</li>
                  </ul>
                </div>

                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="lg"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show setup form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Store className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Shop Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome {invitationData.owner_name}! Set up your account for{" "}
          <span className="font-medium">{invitationData.shop_name}</span>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Password Setup */}
            <div>
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder="At least 8 characters"
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                placeholder="Re-enter your password"
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Shop Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Shop Information
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("shop_details.description")}
                    placeholder="Brief description of your business"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...form.register("shop_details.address")}
                    placeholder="123 Main Street, City, State"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("shop_details.phone")}
                    placeholder="+1-555-0100"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    {...form.register("shop_details.website")}
                    placeholder="https://yourshop.com"
                    className="mt-1"
                  />
                  {errors.shop_details?.website && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.shop_details.website.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="opening_hours">Opening Hours</Label>
                  <Input
                    id="opening_hours"
                    {...form.register("shop_details.opening_hours")}
                    placeholder="Mon-Fri: 9:00-18:00, Sat-Sun: 10:00-16:00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="loyalty_type">Loyalty Program Type</Label>
                  <Select
                    value={watch("shop_details.loyalty_type")}
                    onValueChange={(value) =>
                      setValue(
                        "shop_details.loyalty_type",
                        value as "points" | "coupons"
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Points System</SelectItem>
                      <SelectItem value="coupons">Coupon System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={completeSetup.isPending}
              className="w-full"
              size="lg"
            >
              {completeSetup.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
