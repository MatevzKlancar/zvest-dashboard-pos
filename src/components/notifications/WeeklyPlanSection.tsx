"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  CalendarClock,
  Plus,
  Save,
  Trash2,
  Pause,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  usePlanEntries,
  useSavePlanEntries,
} from "@/hooks/useNotifications";
import {
  DayOfWeek,
  NotificationCategory,
  WeeklyPlan,
  WeeklyPlanEntry,
} from "@/lib/types";
import {
  UI_DAY_ORDER,
  DAY_LABELS_LONG,
  computeNextSends,
  formatInTimezone,
  normalizeTime,
  timeForInput,
} from "@/lib/format";
import { AudiencePreviewChip } from "./AudiencePreviewChip";

const TIMEZONES = [
  "Europe/Ljubljana",
  "Europe/Berlin",
  "Europe/Vienna",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "UTC",
];

const CATEGORY_OPTIONS: { value: NotificationCategory; label: string }[] = [
  { value: "daily_meal", label: "Daily meal" },
  { value: "specials", label: "Special / promo" },
  { value: "manual", label: "Announcement" },
];

interface RowState {
  enabled: boolean;
  send_time_local: string; // HH:MM
  notification_type: NotificationCategory;
  title: string;
  body: string;
}

const EMPTY_ROW: RowState = {
  enabled: false,
  send_time_local: "11:30",
  notification_type: "daily_meal",
  title: "",
  body: "",
};

function buildInitialRows(entries: WeeklyPlanEntry[] | undefined): Record<DayOfWeek, RowState> {
  const map: Record<DayOfWeek, RowState> = {
    0: { ...EMPTY_ROW },
    1: { ...EMPTY_ROW },
    2: { ...EMPTY_ROW },
    3: { ...EMPTY_ROW },
    4: { ...EMPTY_ROW },
    5: { ...EMPTY_ROW },
    6: { ...EMPTY_ROW },
  };
  if (!entries) return map;
  for (const e of entries) {
    map[e.day_of_week] = {
      enabled: e.is_active !== false,
      send_time_local: timeForInput(e.send_time_local),
      notification_type: e.notification_type,
      title: e.title,
      body: e.body,
    };
  }
  return map;
}

export function WeeklyPlanSection() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Auto-select first plan
  useEffect(() => {
    if (!selectedPlanId && plans && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
    if (selectedPlanId && plans && !plans.find((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(plans[0]?.id ?? null);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan: WeeklyPlan | undefined = plans?.find(
    (p) => p.id === selectedPlanId
  );

  const handleCreate = async () => {
    try {
      const plan = await createPlan.mutateAsync({
        name: "Weekly menu",
        timezone: "Europe/Ljubljana",
      });
      setSelectedPlanId(plan.id);
      toast.success("Plan created");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create plan");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Weekly Plan
        </CardTitle>
        <CardDescription>
          Set up recurring notifications for each day of the week. The system
          sends them automatically based on your plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {plansLoading ? (
          <div className="text-sm text-gray-500">Loading plans…</div>
        ) : !plans || plans.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <CalendarClock className="h-10 w-10 text-gray-400 mx-auto" />
            <div>
              <h3 className="font-medium text-gray-900">No weekly plan yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create a plan to send recurring notifications on a weekly schedule.
              </p>
            </div>
            <Button onClick={handleCreate} disabled={createPlan.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createPlan.isPending ? "Creating…" : "Create weekly plan"}
            </Button>
          </div>
        ) : (
          <>
            {plans.length > 1 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="plan-select" className="text-sm">
                  Plan:
                </Label>
                <Select
                  value={selectedPlanId ?? ""}
                  onValueChange={(v) => setSelectedPlanId(v)}
                >
                  <SelectTrigger id="plan-select" className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.is_active ? "" : "(paused)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreate}
                  disabled={createPlan.isPending}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New
                </Button>
              </div>
            )}

            {selectedPlan && (
              <PlanEditor
                plan={selectedPlan}
                onUpdate={(data) =>
                  updatePlan.mutate({ id: selectedPlan.id, data })
                }
                onDelete={async () => {
                  try {
                    await deletePlan.mutateAsync(selectedPlan.id);
                    toast.success("Plan deleted");
                    setSelectedPlanId(null);
                  } catch (err) {
                    toast.error((err as Error).message ?? "Failed to delete plan");
                  }
                }}
                deletePending={deletePlan.isPending}
                updatePending={updatePlan.isPending}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PlanEditor({
  plan,
  onUpdate,
  onDelete,
  deletePending,
  updatePending,
}: {
  plan: WeeklyPlan;
  onUpdate: (data: { name?: string; timezone?: string; is_active?: boolean }) => void;
  onDelete: () => void;
  deletePending: boolean;
  updatePending: boolean;
}) {
  const { data: entries, isLoading: entriesLoading } = usePlanEntries(plan.id);
  const saveEntries = useSavePlanEntries();

  const [name, setName] = useState(plan.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rows, setRows] = useState<Record<DayOfWeek, RowState>>(() =>
    buildInitialRows(entries)
  );
  const [dirty, setDirty] = useState(false);

  // Keep name in sync if plan reloads with a new name
  useEffect(() => {
    setName(plan.name);
  }, [plan.name]);

  // Reset rows when entries load/change
  useEffect(() => {
    setRows(buildInitialRows(entries));
    setDirty(false);
  }, [entries]);

  const updateRow = (dow: DayOfWeek, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [dow]: { ...prev[dow], ...patch } }));
    setDirty(true);
  };

  const enabledEntries: WeeklyPlanEntry[] = useMemo(
    () =>
      UI_DAY_ORDER.flatMap((dow) => {
        const r = rows[dow];
        if (!r.enabled) return [];
        return [
          {
            day_of_week: dow,
            send_time_local: normalizeTime(r.send_time_local),
            notification_type: r.notification_type,
            title: r.title,
            body: r.body,
            is_active: true,
          },
        ];
      }),
    [rows]
  );

  const validationError = useMemo(() => {
    for (const e of enabledEntries) {
      if (!e.title.trim()) return `Title is required for ${DAY_LABELS_LONG[e.day_of_week]}.`;
      if (e.title.length > 100) return `Title too long for ${DAY_LABELS_LONG[e.day_of_week]}.`;
      if (!e.body.trim()) return `Message is required for ${DAY_LABELS_LONG[e.day_of_week]}.`;
      if (e.body.length > 500) return `Message too long for ${DAY_LABELS_LONG[e.day_of_week]}.`;
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(e.send_time_local)) {
        return `Invalid time for ${DAY_LABELS_LONG[e.day_of_week]}.`;
      }
    }
    return null;
  }, [enabledEntries]);

  const handleSave = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      await saveEntries.mutateAsync({ id: plan.id, entries: enabledEntries });
      toast.success("Weekly plan saved");
      setDirty(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save plan");
    }
  };

  const nextSends = useMemo(
    () => computeNextSends(enabledEntries, plan.timezone),
    [enabledEntries, plan.timezone]
  );

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5 space-y-1">
          <Label htmlFor="plan-name">Plan name</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name !== plan.name && name.trim()) {
                onUpdate({ name });
              } else if (!name.trim()) {
                setName(plan.name);
              }
            }}
            disabled={updatePending}
          />
        </div>
        <div className="md:col-span-3 space-y-1">
          <Label htmlFor="plan-tz">Timezone</Label>
          <Select
            value={plan.timezone}
            onValueChange={(v) => onUpdate({ timezone: v })}
          >
            <SelectTrigger id="plan-tz">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
              {!TIMEZONES.includes(plan.timezone) && (
                <SelectItem value={plan.timezone}>{plan.timezone}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <Switch
            id="plan-active"
            checked={plan.is_active}
            onCheckedChange={(checked) => onUpdate({ is_active: checked })}
          />
          <Label htmlFor="plan-active">{plan.is_active ? "Active" : "Paused"}</Label>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={deletePending}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {!plan.is_active && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <Pause className="h-4 w-4 text-yellow-700" />
          <AlertDescription className="text-yellow-900">
            This plan is paused. No notifications will be sent until you re-enable
            it.
          </AlertDescription>
        </Alert>
      )}

      {/* Day grid */}
      {entriesLoading ? (
        <div className="text-sm text-gray-500">Loading entries…</div>
      ) : (
        <div className="space-y-3">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-900">
              <span className="font-semibold">Toggle a day on</span> to schedule
              a send for that day. Days that are off won&apos;t fire.
            </AlertDescription>
          </Alert>
          <div className="text-xs text-gray-500">
            Times are in the plan&apos;s timezone:{" "}
            <span className="font-semibold">{plan.timezone}</span>. Changes apply
            from the next occurrence forward (today is skipped if its time has
            passed).
          </div>
          {UI_DAY_ORDER.map((dow) => {
            const row = rows[dow];
            return (
              <div
                key={dow}
                className={`rounded-lg border p-3 ${
                  row.enabled ? "bg-white" : "bg-gray-50"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-2 flex items-center gap-2 pt-2">
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(checked) =>
                        updateRow(dow, { enabled: checked })
                      }
                      aria-label={`${row.enabled ? "Disable" : "Enable"} ${DAY_LABELS_LONG[dow]}`}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {DAY_LABELS_LONG[dow]}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wide ${
                          row.enabled ? "text-green-700" : "text-gray-400"
                        }`}
                      >
                        {row.enabled ? "On" : "Off"}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      step={300}
                      value={row.send_time_local}
                      onChange={(e) =>
                        updateRow(dow, { send_time_local: e.target.value })
                      }
                      disabled={!row.enabled}
                      title="Changes apply from the next occurrence forward."
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={row.notification_type}
                      onValueChange={(v: NotificationCategory) =>
                        updateRow(dow, { notification_type: v })
                      }
                      disabled={!row.enabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={row.title}
                        onChange={(e) => updateRow(dow, { title: e.target.value })}
                        placeholder="Today's pasta"
                        maxLength={100}
                        disabled={!row.enabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Message</Label>
                      <Textarea
                        value={row.body}
                        onChange={(e) => updateRow(dow, { body: e.target.value })}
                        rows={2}
                        maxLength={500}
                        placeholder="Tagliatelle with truffle…"
                        disabled={!row.enabled}
                      />
                    </div>
                    {row.enabled && (
                      <AudiencePreviewChip
                        category={row.notification_type}
                        compact
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {validationError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-900 text-sm">
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Save button */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-gray-500">
          {dirty ? (
            <span className="text-yellow-700">Unsaved changes</span>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || !!validationError || saveEntries.isPending}
        >
          {saveEntries.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save plan
            </>
          )}
        </Button>
      </div>

      {/* Next 7 sends */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Next 7 sends</h4>
        {nextSends.length === 0 ? (
          <p className="text-xs text-gray-500">
            No upcoming sends. Enable some days above to populate this preview.
          </p>
        ) : (
          <ul className="space-y-1">
            {nextSends.map((s, i) => (
              <li
                key={i}
                className="text-sm flex items-center gap-2 text-gray-700"
              >
                <Badge variant="outline" className="font-normal">
                  {s.category}
                </Badge>
                <span className="font-mono text-xs">
                  {formatInTimezone(s.date, plan.timezone)}
                </span>
                <span>—</span>
                <span className="truncate">{s.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={onDelete}
        title="Delete weekly plan?"
        description={`This will permanently delete "${plan.name}" and all its entries. This cannot be undone.`}
        confirmText="Delete plan"
        cancelText="Cancel"
        variant="destructive"
        loading={deletePending}
      />
    </div>
  );
}
