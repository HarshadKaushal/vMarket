import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("email must be an email address"));

const password = z
  .string()
  .trim()
  .pipe(z.string().min(8, "password must be at least 8 characters"));

function requiredText(label: string) {
  return z.string().trim().min(1, `${label} is required`);
}

export const loginSchema = z.object({
  email,
  password,
});

export const signupSchema = z.object({
  name: requiredText("name"),
  email,
  password,
  shopName: requiredText("shop name"),
  address: requiredText("address"),
  imageUrl: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.union([z.null(), z.url("image URL must be a URL")])),
});

const wholeQuantity = z
  .string()
  .trim()
  .regex(/^\d+$/, "quantity must be a whole number zero or greater")
  .transform((value) => Number(value));

export const productSchema = z.object({
  name: requiredText("name"),
  description: z.string().trim(),
  quantity: wholeQuantity,
});

const offerQuantity = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "quantity must be a whole number greater than zero")
  .transform((value) => Number(value));

export const publishTransferSchema = z.object({
  productId: z.string().regex(/^\d+$/, "Choose a product"),
  quantity: offerQuantity,
  unitPrice: z
    .string()
    .trim()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "unitPrice must be a decimal string with up to 2 decimal places",
    )
    .refine((value) => Number(value) > 0, "unitPrice must be greater than zero"),
});

export function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form";
}

export function apiErrorMessage(body: unknown, fallback: string): string {
  if (body === null || typeof body !== "object" || !("message" in body)) {
    return fallback;
  }

  const message = body.message;
  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message)) {
    const first = message.find((item) => typeof item === "string");
    if (typeof first === "string") {
      return first;
    }
  }

  return fallback;
}
