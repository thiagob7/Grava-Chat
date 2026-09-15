import Stripe from "stripe";

import { env } from "~/env.js";

export const STRIPE_API_VERSION = "2026-08-26.dahlia";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;

export type { Stripe };
