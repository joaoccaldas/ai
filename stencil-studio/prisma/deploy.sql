-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#d24b3f',
    "tagline" TEXT NOT NULL DEFAULT 'See it before you ink',
    "hfKeyId" TEXT,
    "hfKeySecretEnc" TEXT,
    "hfConnected" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'none',
    "plan" TEXT NOT NULL DEFAULT 'none',
    "trialEndsAt" TIMESTAMP(3),
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "depositHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "studioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'flash',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSession" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "clientName" TEXT,
    "clientContact" TEXT,
    "photoUrl" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "sessionId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientContact" TEXT NOT NULL,
    "preferredDate" TEXT,
    "designName" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Render" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "designId" TEXT,
    "designName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider" TEXT NOT NULL DEFAULT 'higgsfield',
    "providerRequestId" TEXT,
    "providerStatusUrl" TEXT,
    "prompt" TEXT,
    "placement" TEXT,
    "bodyUrl" TEXT,
    "designUrl" TEXT,
    "compositeUrl" TEXT,
    "resultUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Render_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Studio_slug_key" ON "Studio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Studio_stripeCustomerId_key" ON "Studio"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Studio_stripeSubscriptionId_key" ON "Studio"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_studioId_idx" ON "User"("studioId");

-- CreateIndex
CREATE INDEX "Design_studioId_idx" ON "Design"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSession_shareToken_key" ON "ClientSession"("shareToken");

-- CreateIndex
CREATE INDEX "ClientSession_studioId_idx" ON "ClientSession"("studioId");

-- CreateIndex
CREATE INDEX "Booking_studioId_idx" ON "Booking"("studioId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Render_studioId_idx" ON "Render"("studioId");

-- CreateIndex
CREATE INDEX "Render_sessionId_idx" ON "Render"("sessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSession" ADD CONSTRAINT "ClientSession_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClientSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Render" ADD CONSTRAINT "Render_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Render" ADD CONSTRAINT "Render_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClientSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================
-- Seed: demo studio  (login: demo@stencil.studio / demo12345)
-- ============================================================
WITH s AS (
  INSERT INTO "Studio"(id,name,slug,plan,"subscriptionStatus","trialEndsAt","accentColor",tagline,"depositHint","bookingEnabled","updatedAt")
  VALUES (gen_random_uuid()::text,'Ironside Tattoo Co.','ironside-demo','studio','trialing', now()+interval '14 days','#d24b3f','See it before you ink','A £50 deposit secures your slot',true, now())
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO "User"(id,email,name,"passwordHash",role,"studioId")
SELECT gen_random_uuid()::text,'demo@stencil.studio','Demo Owner','$2b$10$J3ep69jiInxUwnLsKuFj/.1hc0izIyg.mk0qvvpLiF/n2xuRvT16m','owner', id FROM s
ON CONFLICT (email) DO NOTHING;
