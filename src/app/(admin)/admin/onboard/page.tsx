"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useCreateB2BCustomer, usePosProviders } from "@/hooks/useAdmin";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

const onboardSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  contact_email: z.string().email("Valid email is required"),
  contact_phone: z.string().optional(),
  owner_email: z.string().email("Valid owner email is required"),
  owner_first_name: z.string().min(1, "First name is required"),
  owner_last_name: z.string().min(1, "Last name is required"),
  pos_provider_name: z.string().min(1, "POS provider is required"),
  customer_type: z.enum(["platform", "enterprise"]),
  subscription_tier: z.enum(["basic", "premium", "enterprise"]),
  loyalty_type: z.enum(["points", "coupons"]),
});

type OnboardFormData = z.infer<typeof onboardSchema>;

export default function AdminOnboardPage() {
  const [setupUrl, setSetupUrl] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: posProvidersData, isLoading: posLoading } = usePosProviders();
  const createCustomer = useCreateB2BCustomer();

  const form = useForm<OnboardFormData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      business_name: "",
      contact_email: "",
      contact_phone: "",
      owner_email: "",
      owner_first_name: "",
      owner_last_name: "",
      pos_provider_name: "",
      customer_type: "platform",
      subscription_tier: "basic",
      loyalty_type: "points",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = form;

  const onSubmit = async (data: OnboardFormData) => {
    try {
      const response = (await createCustomer.mutateAsync(data)) as {
        data: { setup_url: string; customer_id: string };
      };

      setSetupUrl(response.data.setup_url);
      setShowSuccess(true);

      // Auto-copy to clipboard
      navigator.clipboard.writeText(response.data.setup_url).then(() => {
        toast.success("Setup URL copied to clipboard!");
      });

      // Reset form for next customer
      reset();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const generateRandomData = () => {
    const businessNames = [
      "Coffee Corner",
      "Tech Solutions Inc",
      "Local Bakery",
      "Fashion Boutique",
      "Fitness Center",
    ];
    const firstNames = ["John", "Jane", "Mike", "Sarah", "David"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Davis"];

    const randomBusiness =
      businessNames[Math.floor(Math.random() * businessNames.length)];
    const randomFirst =
      firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomEmail = `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@${randomBusiness
      .toLowerCase()
      .replace(/\s+/g, "")}.com`;

    setValue("business_name", randomBusiness);
    setValue("contact_email", randomEmail);
    setValue("owner_email", randomEmail);
    setValue("owner_first_name", randomFirst);
    setValue("owner_last_name", randomLast);
    setValue(
      "contact_phone",
      "+1-555-0" +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")
    );
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Customer Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-700">
              The B2B customer has been created and setup instructions have been
              prepared.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-green-800">
                Setup URL for Shop Owner:
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={setupUrl}
                  readOnly
                  className="bg-white border-green-300"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(setupUrl);
                    toast.success("Copied to clipboard!");
                  }}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>Send the setup URL to the shop owner via email</li>
                <li>They will use this link to complete their account setup</li>
                <li>
                  Once setup is complete, they can login to their dashboard
                </li>
                <li>The customer will appear in your customers list</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowSuccess(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Another Customer
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={`mailto:${watch(
                    "owner_email"
                  )}?subject=Setup Your Shop Dashboard&body=Hello,\n\nYour shop dashboard has been created! Please complete your setup using this link:\n\n${setupUrl}\n\nBest regards,\nThe Team`}
                >
                  Send Email
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Create New B2B Customer
        </h1>
        <p className="text-gray-600 mt-2">
          Onboard a new business customer to the platform
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Defaults Applied
          </CardTitle>
          <CardDescription className="text-blue-700">
            Only 7 fields required! Customer type, subscription tier, and
            loyalty type are set to sensible defaults and can be changed later.
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomData}
              >
                Generate Demo Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  {...form.register("business_name")}
                  placeholder="e.g., Coffee Shop Downtown"
                />
                {errors.business_name && (
                  <p className="text-sm text-red-600">
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...form.register("contact_email")}
                  placeholder="contact@coffeeshop.com"
                />
                {errors.contact_email && (
                  <p className="text-sm text-red-600">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  {...form.register("contact_phone")}
                  placeholder="+1-555-0100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos_provider_name">POS Provider *</Label>
                <Select
                  value={watch("pos_provider_name")}
                  onValueChange={(value) =>
                    setValue("pos_provider_name", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select POS Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {posLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      <>
                        {posProvidersData?.data?.map((provider: any) => (
                          <SelectItem key={provider.id} value={provider.name}>
                            {provider.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">
                          Other (will be created)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.pos_provider_name && (
                  <p className="text-sm text-red-600">
                    {errors.pos_provider_name.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Owner Information</CardTitle>
            <CardDescription>
              Setup invitation will be sent to the owner email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="owner_email">Owner Email *</Label>
                <Input
                  id="owner_email"
                  type="email"
                  {...form.register("owner_email")}
                  placeholder="owner@coffeeshop.com"
                />
                {errors.owner_email && (
                  <p className="text-sm text-red-600">
                    {errors.owner_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_first_name">First Name *</Label>
                <Input
                  id="owner_first_name"
                  {...form.register("owner_first_name")}
                  placeholder="John"
                />
                {errors.owner_first_name && (
                  <p className="text-sm text-red-600">
                    {errors.owner_first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_last_name">Last Name *</Label>
                <Input
                  id="owner_last_name"
                  {...form.register("owner_last_name")}
                  placeholder="Smith"
                />
                {errors.owner_last_name && (
                  <p className="text-sm text-red-600">
                    {errors.owner_last_name.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure customer type, subscription, and loyalty program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_type">Customer Type</Label>
                <Select
                  value={watch("customer_type")}
                  onValueChange={(value) =>
                    setValue("customer_type", value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform (Shared)</SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise (Dedicated)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_tier">Subscription Tier</Label>
                <Select
                  value={watch("subscription_tier")}
                  onValueChange={(value) =>
                    setValue("subscription_tier", value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loyalty_type">Loyalty Type</Label>
                <Select
                  value={watch("loyalty_type")}
                  onValueChange={(value) =>
                    setValue("loyalty_type", value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="coupons">Coupons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={createCustomer.isPending}
          className="w-full"
          size="lg"
        >
          {createCustomer.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Customer...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create B2B Customer
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
