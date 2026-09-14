/**
 * Utility Formatters for SKILLPROOF
 */

export const formatCurrency = (amount) => {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return amount;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatPassportId = (id) => {
  if (!id) return '';
  return id.toUpperCase();
};
