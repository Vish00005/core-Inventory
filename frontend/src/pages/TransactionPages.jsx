import React from 'react';
import BaseTransactionPage from './BaseTransactionPage';

export const ReceiptsPage = () => <BaseTransactionPage title="Process Receipts" type="RECEIPT" endpoint="receipt" />;
export const DeliveriesPage = () => <BaseTransactionPage title="Process Deliveries" type="DELIVERY" endpoint="delivery" />;
export const TransfersPage = () => <BaseTransactionPage title="Internal Transfers" type="TRANSFER" endpoint="transfer" />;
export const AdjustmentsPage = () => <BaseTransactionPage title="Stock Adjustments" type="ADJUSTMENT" endpoint="adjustment" />;
