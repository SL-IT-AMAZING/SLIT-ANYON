CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"polar_customer_id" text,
	"polar_product_id" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"credits_limit" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
