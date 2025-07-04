-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'TABBY');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "tabbyCheckoutUrl" TEXT,
ADD COLUMN     "tabbyPaymentId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_tabbyPaymentId_key" ON "Payment"("tabbyPaymentId"); 