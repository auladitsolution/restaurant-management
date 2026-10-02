// ==========================================
// RESTAURANT POS & MANAGEMENT SYSTEM TYPES
// ==========================================

export type UserRole =
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "WAITER"
  | "KITCHEN"
  | "INVENTORY_MANAGER";

export type Permission =
  | "dashboard:view"
  | "pos:access"
  | "orders:create"
  | "orders:read"
  | "orders:update"
  | "orders:cancel"
  | "tables:manage"
  | "kitchen:access"
  | "menu:manage"
  | "inventory:manage"
  | "purchases:manage"
  | "expenses:manage"
  | "customers:manage"
  | "shifts:manage"
  | "reports:view"
  | "reports:profit"
  | "users:manage"
  | "settings:manage"
  | "audit:view"
  | "backup:export";

export interface IUser {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IRestaurantSettings {
  _id?: string;
  name: string;
  nameBn: string;
  tagline?: string;
  logo?: string;
  phone: string;
  email?: string;
  address: string;
  vatEnabled: boolean;
  vatRate: number; // Percentage e.g. 5
  vatRegistrationNumber?: string;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number; // Percentage e.g. 5
  receiptFooterMessage: string;
  receiptFooterMessageBn: string;
  currency: string; // "BDT"
  currencySymbol: string; // "৳"
  timezone: string; // "Asia/Dhaka"
  invoicePrefix: string; // "INV-"
  orderPrefix: string; // "ORD-"
  features: {
    inventory: boolean;
    kitchenDisplay: boolean;
    purchaseManagement: boolean;
    expenseManagement: boolean;
    advancedReports: boolean;
    customerManagement: boolean;
    shiftManagement: boolean;
    autoIngredientDeduction: boolean;
  };
  tableCount?: number;
  updatedAt?: string | Date;
}

export interface ICategory {
  _id: string;
  nameBn: string;
  nameEn: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IMenuItemVariant {
  nameBn: string;
  nameEn: string;
  price: number;
  costPrice?: number;
}

export interface IMenuItemAddOn {
  nameBn: string;
  nameEn: string;
  price: number;
}

export interface IMenuItemIngredientRef {
  inventoryItemId: string;
  quantity: number;
  unit: string;
}

export interface IMenuItem {
  _id: string;
  nameBn: string;
  nameEn: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  image?: string;
  basePrice: number;
  costPrice: number;
  hasVariants: boolean;
  variants: IMenuItemVariant[];
  addOns: IMenuItemAddOn[];
  ingredients?: IMenuItemIngredientRef[];
  availability: boolean;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING";

export interface ITable {
  _id: string;
  tableNumber: string;
  nameBn?: string;
  floor: string;
  capacity: number;
  status: TableStatus;
  activeOrderId?: string;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IFloor {
  _id: string;
  name: string;
  nameBn: string;
  sortOrder: number;
  active: boolean;
}

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type OrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export type KitchenStatus = "NEW" | "PREPARING" | "READY" | "SERVED";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "CARD"
  | "BANK"
  | "DUE";

export interface IPaymentRecord {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  receivedAt: string | Date;
}

export interface IOrderItem {
  menuItemId: string;
  nameBn: string;
  nameEn: string;
  variantNameBn?: string;
  variantNameEn?: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
  addOns?: {
    nameBn: string;
    price: number;
  }[];
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  orderType: OrderType;
  tableId?: string;
  tableName?: string;
  floorName?: string;
  guestCount?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  waiterId?: string;
  waiterName?: string;
  items: IOrderItem[];
  subtotal: number;
  discountType: "PERCENT" | "FIXED";
  discountRate: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  paymentRecords: IPaymentRecord[];
  orderStatus: OrderStatus;
  kitchenStatus: KitchenStatus;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: {
    userId: string;
    name: string;
  };
  cancelledAt?: string | Date;
  inventoryDeducted: boolean;
  createdBy: {
    userId: string;
    name: string;
    role: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type InventoryUnit =
  | "kg"
  | "gram"
  | "liter"
  | "ml"
  | "pcs"
  | "packet"
  | "box";

export interface IInventoryItem {
  _id: string;
  nameBn: string;
  nameEn: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  averageCost: number;
  supplierId?: string;
  supplierName?: string;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type StockMovementType =
  | "PURCHASE"
  | "SALE_CONSUMPTION"
  | "ADJUSTMENT"
  | "WASTE"
  | "RETURN";

export interface IStockMovement {
  _id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  unit: InventoryUnit;
  type: StockMovementType;
  quantityDelta: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  referenceType?: "ORDER" | "PURCHASE" | "MANUAL_ADJUSTMENT" | "ORDER_CANCEL";
  referenceId?: string;
  reason?: string;
  performedBy: {
    userId: string;
    name: string;
  };
  createdAt: string | Date;
}

export interface IRecipeIngredient {
  inventoryItemId: string;
  quantity: number; // in the unit of the inventory item
  unit: InventoryUnit;
}

export interface IRecipe {
  _id: string;
  menuItemId: string;
  menuItemNameBn: string;
  variantName?: string;
  ingredients: IRecipeIngredient[];
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ISupplier {
  _id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address?: string;
  currentDue: number;
  notes?: string;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IPurchaseItem {
  inventoryItemId: string;
  itemName: string;
  unit: InventoryUnit;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IPurchase {
  _id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: IPurchaseItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
  purchaseDate: string | Date;
  notes?: string;
  attachment?: string;
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type ExpenseCategory =
  | "বাজার"
  | "বেতন"
  | "ভাড়া"
  | "বিদ্যুৎ"
  | "গ্যাস"
  | "পানি"
  | "পরিবহন"
  | "মেরামত"
  | "মার্কেটিং"
  | "অন্যান্য";

export interface IExpense {
  _id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string | Date;
  paymentMethod: PaymentMethod;
  attachment?: string;
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICashShift {
  _id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  startTime: string | Date;
  endTime?: string | Date;
  openingCash: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  refunds: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  status: "OPEN" | "CLOSED";
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  totalDue: number;
  lastOrderDate?: string | Date;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: "ORDER" | "KITCHEN" | "LOW_STOCK" | "CUSTOMER_DUE" | "SUPPLIER_DUE" | "SYSTEM";
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: "ORDER" | "INVENTORY" | "CUSTOMER" | "SUPPLIER";
  createdAt: string | Date;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: string | Date;
}
