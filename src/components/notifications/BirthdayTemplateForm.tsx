"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cake, Save, Info, Smartphone, CheckCircle2, Bell } from "lucide-react";
import {
  useBirthdayTemplate,
  useSaveBirthdayTemplate,
} from "@/hooks/useNotifications";

const birthdaySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  body: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be 500 characters or less"),
  is_active: z.boolean(),
});

type BirthdayFormData = z.infer<typeof birthdaySchema>;

export function BirthdayTemplateForm() {
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: templateResponse, isLoading } = useBirthdayTemplate();
  const { mutate: saveTemplate, isPending } = useSaveBirthdayTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BirthdayFormData>({
    resolver: zodResolver(birthdaySchema),
    defaultValues: {
      title: "",
      body: "",
      is_active: false,
    },
  });

  // Load existing template
  useEffect(() => {
    if (templateResponse?.data) {
      const template = templateResponse.data;
      reset({
        title: template.title,
        body: template.body,
        is_active: template.is_active,
      });
    }
  }, [templateResponse, reset]);

  const titleLength = watch("title")?.length || 0;
  const bodyLength = watch("body")?.length || 0;
  const isActive = watch("is_active");

  const onSubmit = (data: BirthdayFormData) => {
    saveTemplate(data, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      },
      onError: (error) => {
        console.error("Failed to save birthday template:", error);
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Birthday Notification Settings
          </CardTitle>
          <CardDescription>
            Configure automated birthday messages sent to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Birthday Notifications</Label>
                <p className="text-sm text-gray-500">
                  Automatically send birthday messages to customers
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="Happy Birthday! 🎉"
                {...register("title")}
                disabled={isPending}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
              <p className="text-sm text-gray-500">{titleLength}/100 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="It's your special day! Visit us today and get 20% off when you spend $30 or more."
                rows={5}
                {...register("body")}
                disabled={isPending}
              />
              {errors.body && (
                <p className="text-sm text-red-600">{errors.body.message}</p>
              )}
              <p className="text-sm text-gray-500">{bodyLength}/500 characters</p>
            </div>

            {showSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Birthday notification settings saved successfully!
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview & Info Cards */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Preview
            </CardTitle>
            <CardDescription>
              How the birthday notification will appear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
              <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Bell className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">
                      {watch("title") || "Happy Birthday! 🎉"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {watch("body") || "Your birthday message will appear here..."}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">9:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">How Birthday Notifications Work:</div>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Sent automatically once daily at 9:00 AM</li>
                <li>Only sent to customers celebrating their birthday that day</li>
                <li>
                  Status: <strong>{isActive ? "Enabled" : "Disabled"}</strong>
                </li>
                <li>Customers must have the mobile app to receive notifications</li>
                <li>Messages are personalized automatically</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Pro Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Personalization:</strong> Make customers feel special with warm
              birthday wishes
            </p>
            <p>
              <strong>Incentive:</strong> Include a special birthday offer or discount
            </p>
            <p>
              <strong>Time-sensitive:</strong> Mention if the offer is valid only on
              their birthday
            </p>
            <p>
              <strong>Clear CTA:</strong> Tell them exactly what to do (e.g., &ldquo;Visit us
              today!&rdquo;)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
