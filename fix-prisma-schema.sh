#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_PASSWORD="TpFdwT2XKZ7UuF1jF8"
REMOTE_DIR="/var/www/greenroasteries"

# Log message with color
log() {
  local type=$1
  local message=$2
  
  case $type in
    "info")
      echo -e "${BLUE}[INFO]${NC} $message"
      ;;
    "success")
      echo -e "${GREEN}[SUCCESS]${NC} $message"
      ;;
    "warning")
      echo -e "${YELLOW}[WARNING]${NC} $message"
      ;;
    "error")
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    "step")
      echo -e "${CYAN}[STEP]${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Main function
main() {
  log "step" "Starting Prisma schema fix by direct creation..."
  
  # SSH into the server and create the schema directly
  log "step" "Creating Prisma schema on server..."
  
  ssh $SERVER_USER@$SERVER_IP << 'EOF'
    cd /var/www/greenroasteries
    
    # Ensure prisma directory exists
    echo "Creating prisma directory..."
    mkdir -p prisma
    
    # Create schema.prisma file directly on the server
    echo "Creating schema.prisma file..."
    cat > prisma/schema.prisma << 'PRISMA_SCHEMA'
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  address   String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
  permissions Permission[]
}

model Permission {
  id        String   @id @default(uuid())
  userId    String
  module    String   // e.g., "products", "categories", "orders"
  canView   Boolean  @default(false)
  canCreate Boolean  @default(false)
  canEdit   Boolean  @default(false)
  canDelete Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, module])
}

model Category {
  id            String     @id @default(uuid())
  name          String
  nameAr        String?
  description   String?
  descriptionAr String?
  slug          String     @unique
  imageUrl      String?
  isActive      Boolean    @default(true)
  parentId      String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  parent        Category?  @relation("CategoryToSubcategory", fields: [parentId], references: [id])
  children      Category[] @relation("CategoryToSubcategory")
  products      Product[]
}

model Product {
  id            String             @id @default(uuid())
  name          String
  nameAr        String?
  description   String?
  descriptionAr String?
  price         Float
  imageUrl      String?
  categoryId    String
  origin        String?
  inStock       Boolean            @default(true)
  stockQuantity Int                @default(0)
  sku           String?            @unique
  weight        Float?
  dimensions    String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  bundleItems   BundleItem[]       @relation("BundleProducts")
  bundles       BundleItem[]       @relation("ContainedInBundle")
  orderItems    OrderItem[]
  category      Category           @relation(fields: [categoryId], references: [id])
  images        ProductImage[]
  promotions    ProductPromotion[]
  variations    ProductVariation[]
}

model ProductImage {
  id        String   @id @default(uuid())
  url       String
  alt       String?
  productId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model VariationSize {
  id          String             @id @default(uuid())
  name        String
  value       Int
  displayName String
  isActive    Boolean            @default(true)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  variations  ProductVariation[]
}

model VariationType {
  id         String             @id @default(uuid())
  name       String
  arabicName String?
  description String?
  isActive   Boolean            @default(true)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
  variations ProductVariation[]
}

model VariationBeans {
  id          String             @id @default(uuid())
  name        String
  arabicName  String?
  description String?
  isActive    Boolean            @default(true)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  variations  ProductVariation[]
}

model ProductVariation {
  id            String          @id @default(uuid())
  productId     String
  sizeId        String
  typeId        String?
  price         Float
  sku           String?         @unique
  stockQuantity Int             @default(0)
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  beansId       String?
  imageUrl      String?
  beans         VariationBeans? @relation(fields: [beansId], references: [id])
  product       Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  size          VariationSize   @relation(fields: [sizeId], references: [id])
  type          VariationType?  @relation(fields: [typeId], references: [id])
}

model Order {
  id              String      @id @default(uuid())
  userId          String
  subtotal        Float
  tax             Float
  shippingCost    Float
  discount        Float       @default(0)
  total           Float
  status          OrderStatus @default(NEW)
  paymentMethod   String?
  paymentId       String?
  shippingAddress String?
  trackingNumber  String?
  notes           String?
  appliedPromoId  String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  appliedPromo    Promotion?  @relation(fields: [appliedPromoId], references: [id])
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Float
  subtotal  Float
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
}

model Promotion {
  id             String             @id @default(uuid())
  name           String
  description    String?
  code           String?            @unique
  type           PromotionType
  value          Float              @default(0)
  minOrderAmount Float?
  maxUses        Int?
  currentUses    Int                @default(0)
  isActive       Boolean            @default(true)
  startDate      DateTime
  endDate        DateTime
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  orders         Order[]
  products       ProductPromotion[]
}

model ProductPromotion {
  productId   String
  promotionId String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  promotion   Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  @@id([productId, promotionId])
}

model BundleItem {
  id                 String  @id @default(uuid())
  bundleProductId    String
  containedProductId String
  quantity           Int
  discount           Float?
  bundleProduct      Product @relation("BundleProducts", fields: [bundleProductId], references: [id], onDelete: Cascade)
  containedProduct   Product @relation("ContainedInBundle", fields: [containedProductId], references: [id])

  @@unique([bundleProductId, containedProductId])
}

model Slider {
  id              String   @id @default(uuid())
  title           String
  titleAr         String?
  subtitle        String
  subtitleAr      String?
  buttonText      String
  buttonTextAr    String?
  buttonLink      String
  backgroundColor String   @default("#f4f6f8")
  imageUrl        String
  order           Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum UserRole {
  ADMIN
  MANAGER
  TEAM
  CUSTOMER
}

enum OrderStatus {
  NEW
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PromotionType {
  BUNDLE
  PERCENTAGE
  FIXED_AMOUNT
  BUY_X_GET_Y
  FREE_SHIPPING
}
PRISMA_SCHEMA
    
    # Create a simple Prisma seed file
    echo "Creating seed.ts file..."
    cat > prisma/seed.ts << 'SEED_TS'
import { PrismaClient } from '../app/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Add admin user if it doesn't exist
  const adminEmail = 'admin@greenroasteries.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED_TS
    
    # Fix file permissions
    echo "Setting correct permissions..."
    chmod -R 755 prisma
    
    # Ensure NODE_ENV is set to production
    echo "Updating environment variables..."
    grep -q "NODE_ENV=production" .env || echo "NODE_ENV=production" >> .env
    
    # Create migrations folder if it doesn't exist
    mkdir -p prisma/migrations
    
    # Remove old containers to ensure clean restart
    echo "Stopping any running containers..."
    docker-compose down
    
    # Rebuild the application
    echo "Rebuilding and starting the application..."
    docker-compose up --build -d
    
    # Wait for containers to start
    echo "Waiting for containers to start..."
    sleep 20
    
    # Check container status
    echo "Docker container status:"
    docker ps
    
    # Check logs for any issues
    echo "Container logs:"
    docker logs $(docker ps | grep greenroasteries-app | awk '{print $1}') 2>&1 | tail -n 30 || echo "No app container found"
    
    # Restart Nginx
    echo "Restarting Nginx..."
    systemctl restart nginx
    
    # Verify Nginx is properly proxying to the application
    echo "Testing site availability:"
    curl -I localhost:3001 || echo "Site not available on port 3001"
EOF
  
  log "success" "Prisma schema fix completed!"
  log "info" "Please check if the website is now accessible at https://thegreenroasteries.com"
}

# Run the main function
main 