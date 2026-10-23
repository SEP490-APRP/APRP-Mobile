// productStatus.js — skeleton product status constants

export const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  REJECTED: 'REJECTED',
};

export const PRODUCT_STATUS_LABEL = {
  [PRODUCT_STATUS.ACTIVE]: 'Đang bán',
  [PRODUCT_STATUS.INACTIVE]: 'Ngừng bán',
  [PRODUCT_STATUS.OUT_OF_STOCK]: 'Hết hàng',
  [PRODUCT_STATUS.PENDING_APPROVAL]: 'Chờ duyệt',
  [PRODUCT_STATUS.REJECTED]: 'Bị từ chối',
};
