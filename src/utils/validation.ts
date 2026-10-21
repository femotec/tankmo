import { z } from "zod";
const iso = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());
const metadata = { id: z.uuid(), createdAt: iso, updatedAt: iso };
const exact = (places: number, positive: boolean) =>
  z
    .string()
    .regex(new RegExp(`^\\d+\\.\\d{${places}}$`))
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && (positive ? n > 0 : n >= 0);
    });
export const settingsSchema = z.object({
  id: z.literal("main"),
  appearance: z.enum(["auto", "light", "dark"]),
  preferredTankbookSort: z.enum(["newest", "oldest", "highest", "lowest"]),
  defaultFuelType: z.enum(["superE5", "superE10", "superPlus"]),
  lastBackup: iso.optional(),
});
export const fuelSchema = z.object({
  ...metadata,
  date: iso,
  fuelType: z.enum(["superE5", "superE10", "superPlus"]),
  liters: exact(3, true),
  totalCost: exact(2, false),
  odometer: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  isFullTank: z.boolean().optional(),
  stationId: z.uuid().optional(),
  note: z.string().optional(),
  dataGap: z.boolean().optional(),
});
export const odometerSchema = z.object({
  ...metadata,
  date: iso,
  odometer: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  note: z.string().optional(),
});
export const stationSchema = z.object({
  ...metadata,
  name: z.string().trim().min(1),
  locationDescription: z.string().optional(),
  deleted: z.boolean().optional(),
});
export const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    appVersion: z.string(),
    createdAt: iso,
    fuel: z.array(fuelSchema),
    odometer: z.array(odometerSchema),
    stations: z.array(stationSchema),
    settings: settingsSchema,
  })
  .superRefine((b, ctx) => {
    for (const key of ["fuel", "odometer", "stations"] as const) {
      const ids = b[key].map((r) => r.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: "custom", message: `Doppelte IDs: ${key}` });
    }
    const stations = new Set(b.stations.map((s) => s.id));
    if (b.fuel.some((f) => f.stationId && !stations.has(f.stationId)))
      ctx.addIssue({
        code: "custom",
        message: "Eine Tankstellenreferenz fehlt.",
      });
  });
