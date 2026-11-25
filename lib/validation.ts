import { z } from "zod";

export const postcodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/,
    "Enter a valid UK postcode.",
  )
  .transform((s) => s.replace(/\s/g, "").replace(/(.{3})$/, " $1"));
const safeNotes = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (s) =>
        !/(door|gate|alarm|key[ -]?safe|entry)\s*(access\s*)?(code|pin)\s*[:=\-]?\s*\d/i.test(
          s,
        ),
      "Please remove access codes. Arrange secure access directly with Rose.",
    );
export const draftSchema = z
  .object({
    postcode: postcodeSchema,
    serviceId: z.string().min(1).max(50),
    propertyType: z.enum(["flat", "house", "other"]),
    propertyDetails: safeNotes(500).optional(),
    bedrooms: z.number().int().min(0).max(10).nullable(),
    bathrooms: z.number().int().min(1).max(10).nullable(),
    address: z
      .string()
      .trim()
      .min(5, "Enter the full property address.")
      .max(300),
    extras: z
      .array(z.string().max(50))
      .max(12)
      .refine((v) => new Set(v).size === v.length, "Choose each extra once."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
        "Choose a valid date.",
      ),
    windowId: z.string().min(1, "Choose an arrival window.").max(50),
    notes: safeNotes(1500),
    pets: safeNotes(300),
    access: safeNotes(500),
  })
  .strict();
export const estimateSchema = draftSchema
  .omit({ address: true, date: true, windowId: true, postcode: true })
  .extend({
    address: z.string().max(300).default(""),
    date: z.string().max(10).default(""),
    windowId: z.string().max(50).default(""),
    postcode: z.string().max(12).default(""),
  });
export const requestSchema = z
  .object({
    draft: draftSchema,
    quoteToken: z.string().min(1),
    idempotencyKey: z.uuid(),
    policyVersion: z.string().nullable(),
    acknowledged: z.literal(true),
  })
  .strict();
export const contactSchema = z
  .object({
    kind: z.enum(["contact", "office"]),
    name: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    subject: z
      .string()
      .trim()
      .max(150)
      .regex(/^[^\r\n]*$/)
      .default("General enquiry"),
    phone: z.string().max(30),
    message: safeNotes(3000).refine(
      (v) => v.length >= 10,
      "Please include a little more detail.",
    ),
    company: z.string().max(150),
    postcode: z.string().max(12),
    website: z.string().max(0, "Unable to submit."),
    idempotencyKey: z.uuid(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.kind === "office") {
      if (v.company.trim().length < 2)
        ctx.addIssue({
          code: "custom",
          path: ["company"],
          message: "Enter your company name.",
        });
      if (!postcodeSchema.safeParse(v.postcode).success)
        ctx.addIssue({
          code: "custom",
          path: ["postcode"],
          message: "Enter a valid office postcode.",
        });
    }
  });

// A preference-only request. Ownership, status, price and assignment are never inputs.
export const cleaningRequestSchema = draftSchema
  .pick({
    serviceId: true,
    address: true,
    postcode: true,
    date: true,
    windowId: true,
    propertyType: true,
    propertyDetails: true,
    notes: true,
  })
  .extend({
    propertyDetails: safeNotes(500).refine(
      (v) => v.length >= 3,
      "Tell us a little about the property.",
    ),
    idempotencyKey: z.uuid(),
  })
  .strict();
export type CleaningRequestInput = z.infer<typeof cleaningRequestSchema>;

export const authSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("signup"),
      name: z.string().trim().min(2).max(120),
      email: z.email().max(254),
      password: z.string().min(12).max(200),
      next: z.string().max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("login"),
      email: z.email().max(254),
      password: z.string().min(1).max(200),
      next: z.string().max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("forgot"),
      email: z.email().max(254),
      next: z.string().max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("resend"),
      email: z.email().max(254),
      next: z.string().max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("magic"),
      email: z.email().max(254),
      next: z.string().max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("reset"),
      password: z.string().min(12).max(200),
      next: z.string().max(500).optional(),
    })
    .strict(),
  z.object({ action: z.literal("logout") }).strict(),
]);
export const profileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30),
  })
  .strict();
export const addressSchema = z
  .object({
    id: z.uuid().optional(),
    label: z.string().trim().min(1).max(60),
    address: z.string().trim().min(5).max(300),
    postcode: postcodeSchema,
  })
  .strict();
const pence = z.number().int().min(0).max(10000000);
const minutes = z.number().int().min(0).max(1440);
export const pricingSchema = z.object({
  version: z.string().min(1).max(80),
  approved: z.boolean(),
  demo: z.boolean(),
  services: z.record(
    z.string(),
    z.object({
      hourlyPence: pence,
      baseMinutes: minutes,
      bedroomMinutes: minutes,
      bathroomMinutes: minutes,
      minimumPence: pence,
    }),
  ),
  extras: z.record(z.string(), z.object({ pence, minutes })),
  adjustments: z
    .array(
      z.object({
        label: z.string().min(1).max(100),
        pence: z.number().int().min(-1000000).max(1000000),
      }),
    )
    .max(20),
  totalNote: z.string().max(300),
});
export const availabilitySchema = z
  .object({
    configured: z.boolean(),
    workingDays: z.array(z.number().int().min(0).max(6)).min(1),
    windows: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9-]{1,30}$/),
            label: z.string().min(1).max(50),
            start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          })
          .refine((w) => w.end > w.start, "Window end must follow start."),
      )
      .min(1)
      .max(10),
    leadHours: z.number().int().min(0).max(720),
    capacity: z.number().int().min(1).max(100),
    horizonDays: z.number().int().min(1).max(365),
    blackoutDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(366),
  })
  .refine(
    (v) => new Set(v.windows.map((w) => w.id)).size === v.windows.length,
    "Window IDs must be unique.",
  );
export const serviceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,50}$/),
  name: z.string().min(2).max(120),
  description: z.string().max(300),
  detail: z.string().max(2000),
  kind: z.enum(["service", "extra"]),
  active: z.boolean(),
  duration_minutes: z.number().int().min(15).max(720),
  team_size: z.number().int().min(1).max(10),
  sort_order: z.number().int().min(0).max(100),
});
