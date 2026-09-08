export const formatAmount = amount => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  const num = Number(amount);
  if (Number.isInteger(num)) {
    return num.toLocaleString('en-PK');
  }
  return num.toFixed(2);
};

export const formatDate = unixTimestamp => {
  if (!unixTimestamp) {
    return '';
  }
  const date = new Date(
    unixTimestamp > 9999999999 ? unixTimestamp : unixTimestamp * 1000,
  );
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffMs = startOfToday - startOfDate;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  if (year === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
};
