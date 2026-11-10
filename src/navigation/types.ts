import type { NavigatorScreenParams } from '@react-navigation/native';

export type SalesStackParamList = {
  Sales: undefined;
  SaleDetails: { saleId: string };
  CreateSale: undefined;
};

export type CustomersStackParamList = {
  Customers: undefined;
  CustomerDetails: { customerId: string };
  CustomerForm: { customerId?: string };
};

export type MoreStackParamList = {
  More: undefined;
  Products: undefined;
  ProductDetails: { productId: string };
  ProductForm: { productId?: string };
  Invoices: undefined;
  InvoiceDetails: { invoiceId: string };
  RecordPayment: {invoiceId: string};
  CreateInvoice: undefined;
  Reports: undefined;
  Settings: undefined;
  BusinessProfile: undefined;
  InvoiceSettings: undefined;
  DataManagement: undefined;
  Appearance: undefined;
};

export type ProductsStackParamList = {
  Products: undefined;
  ProductDetails: {
    productId: string;
  };
  ProductForm: {
    productId?: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  SalesTab: NavigatorScreenParams<SalesStackParamList>;
  CustomersTab: NavigatorScreenParams<CustomersStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainTabParamList { }
  }
}
