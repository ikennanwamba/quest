// Event listener for the "Analyze Spending" button
document.getElementById("analyze-btn").addEventListener("click", async () => {
  const transactions = [
    { date: "2025-01-11", amount: 398.34, platform: "FanDuel", type: "betting" },
    { date: "2025-01-10", amount: 150.0, platform: "DraftKings", type: "casino" },
    { date: "2025-01-09", amount: 75.5, platform: "Horse Racing", type: "betting" },
  ];

  try {
    const response = await fetch("/generate-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions }),
    });

    if (!response.ok) {
      // Handle non-2xx status codes
      const errorData = await response.json();
      console.error("Error fetching AI insights:", errorData);
      alert(`Error: ${errorData.message}`);
      return;
    }

    const data = await response.json();
    console.log("AI Insights:", data.insights);
    displayInsights(data.insights); // Display the insights
  } catch (error) {
    console.error("Unexpected Error:", error.message);
    alert("Unexpected error occurred. Please try again later.");
  }
});

// Function to display AI insights
function displayInsights(insights) {
  const container = document.getElementById("insights-container");
  container.innerHTML = ""; // Clear previous insights

  insights.forEach((insight) => {
    const p = document.createElement("p");
    p.textContent = insight;
    container.appendChild(p);
  });
}

// Event listener for the "Connect to Plaid" button
document.getElementById("linkButton").addEventListener("click", async () => {
  try {
    const response = await fetch("http://localhost:3001/create-link-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch link token");
    }

    const data = await response.json();
    const linkToken = data.link_token;

    const handler = Plaid.create({
      token: linkToken,
      onSuccess: async (publicToken, metadata) => {
        console.log("Public Token:", publicToken);

        const exchangeResponse = await fetch(
          "http://localhost:3001/exchange-public-token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token: publicToken }),
          }
        );

        if (!exchangeResponse.ok) {
          throw new Error("Failed to exchange public token");
        }

        const exchangeData = await exchangeResponse.json();
        console.log("Access Token:", exchangeData.access_token);

        // Fetch transactions
        await fetchTransactions(exchangeData.access_token);
      },
      onExit: (err) => {
        console.error("Exit Error:", err);
      },
    });

    handler.open();
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to load Plaid Link. Please try again.");
  }
});

// Function to fetch transactions
async function fetchTransactions(accessToken) {
  try {
    console.log("Fetching transactions...");
    const response = await fetch("http://localhost:3001/get-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const { transactions } = await response.json();
    console.log("Transactions fetched:", transactions);

    if (!transactions || transactions.length === 0) {
      alert("No transactions found.");
      return;
    }

    // Render graph and transaction list
    renderGraph(transactions);
    renderTransactionList(transactions);

    // Switch to transactions view
    document.getElementById("connectView").classList.remove("active");
    document.getElementById("transactionsView").classList.add("active");
  } catch (error) {
    console.error("Error fetching transactions:", error);
    alert("Failed to load transaction data. Please try again.");
  }
}

// Function to render transaction list
function renderTransactionList(transactions) {
  const transactionList = document.getElementById("transactionList");
  transactionList.innerHTML = ""; // Clear existing transactions

  transactions.forEach((tx) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${tx.date} - ${tx.platform}: $${tx.amount.toFixed(
      2
    )}`;
    transactionList.appendChild(listItem);
  });
}

// Global variable to manage Chart.js instance
let chartInstance;

// Function to render graph
function renderGraph(transactions) {
  const spendingData = transactions.reduce((acc, tx) => {
    const date = tx.date;
    acc[date] = (acc[date] || 0) + tx.amount;
    return acc;
  }, {});

  const ctx = document.getElementById("spendingChart").getContext("2d");

  // Destroy the existing chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create a new chart instance
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(spendingData),
      datasets: [
        {
          label: "Spending Over Time",
          data: Object.values(spendingData),
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: "Date" },
        },
        y: {
          title: { display: true, text: "Amount (USD)" },
        },
      },
    },
  });
}

