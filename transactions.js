document.addEventListener('DOMContentLoaded', async () => {
  const accessToken = localStorage.getItem('access_token');

  if (!accessToken) {
    alert('No access token found. Please connect your bank first.');
    window.location.href = '/';
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/get-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    const transactions = data.transactions;

    // Render graph
    const ctx = document.getElementById('transactionsGraph').getContext('2d');
    const monthlySpending = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
      acc[month] = (acc[month] || 0) + transaction.amount;
      return acc;
    }, {});

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(monthlySpending),
        datasets: [{
          label: 'Monthly Gambling Spending',
          data: Object.values(monthlySpending),
        }],
      },
    });

    // Render list
    const transactionsList = document.getElementById('transactionsList');
    transactions.forEach((transaction) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${transaction.date}: ${transaction.name} - $${transaction.amount}`;
      transactionsList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
});

