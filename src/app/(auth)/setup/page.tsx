"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { completeShopSetup } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Store, CheckCircle } from "lucide-react";
import { InvitationData, SetupFormData } from "@/lib/types";

function SetupPageContent() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SetupFormData>({
    password: "",
    confirmPassword: "",
    shop_name: "",
    shop_description: "",
    shop_address: "",
    shop_phone: "",
    shop_email: "",
    loyalty_type: "points",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error("Invalid setup link");
        router.push("/login");
        return;
      }

      try {
        const invitationData = await apiClient.getInvitation(token);
        setInvitation(invitationData);
        setFormData((prev: SetupFormData) => ({
          ...prev,
          shop_name: invitationData.shop_name,
          shop_email: invitationData.customer_email,
        }));
      } catch {
        toast.error("Invalid or expired setup link");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, router]);

  const handleInputChange = (field: keyof SetupFormData, value: string) => {
    setFormData((prev: SetupFormData) => ({ ...prev, [field]: value }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Complete shop setup
      await apiClient.completeShopSetup({
        invitation_token: token || "",
        password: formData.password,
        shop_details: {
          description: formData.shop_description,
          address: formData.shop_address,
          phone: formData.shop_phone,
          website: formData.shop_email,
          loyalty_type: formData.loyalty_type,
        },
      });

      // Sign up with Supabase
      const { error } = await completeShopSetup(
        invitation?.customer_email || "",
        formData.password,
        token || ""
      );

      if (error) {
        toast.error(error.message);
      } else {
        setStep(3);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error) {
      toast.error("Failed to complete setup");
      console.error("Setup error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Complete Shop Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome {invitation.customer_name}! Set up your shop:{" "}
            {invitation.shop_name}
          </p>
        </div>

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Create Your Password</CardTitle>
                <CardDescription>
                  Choose a secure password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={invitation.customer_email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      placeholder="Create a password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                      placeholder="Confirm your password"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Continue to Shop Details
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Shop Details</CardTitle>
                <CardDescription>
                  Complete your shop information (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep2Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop_name">Shop Name</Label>
                    <Input
                      id="shop_name"
                      value={formData.shop_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("shop_name", e.target.value)
                      }
                      placeholder="Your shop name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shop_description">Description</Label>
                    <Textarea
                      id="shop_description"
                      value={formData.shop_description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleInputChange("shop_description", e.target.value)
                      }
                      placeholder="Describe your shop"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loyalty_type">Loyalty Program Type</Label>
                    <Select
                      value={formData.loyalty_type}
                      onValueChange={(value: "points" | "coupons") =>
                        handleInputChange("loyalty_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select loyalty type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Points System</SelectItem>
                        <SelectItem value="coupons">Coupons System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  Setup Complete!
                </CardTitle>
                <CardDescription className="text-center">
                  Your shop has been set up successfully. Redirecting to
                  dashboard...
                </CardDescription>
              </CardHeader>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SetupPageContent />
    </Suspense>
  );
}
