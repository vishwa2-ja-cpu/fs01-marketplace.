export const rupees = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const errMsg = (err) => {
  const d = err.response?.data;
  return d?.details?.map((x) => `${x.field}: ${x.message}`).join(', ') || d?.message || err.message || 'Something went wrong';
};
