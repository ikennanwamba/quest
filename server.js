import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import OpenAI from "openai";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve static files (index.html and index.js)
app.use(express.static(path.join(__dirname))); // Serve static files from the root directory

const PORT = process.env.PORT || 3001;

// Plaid API configuration
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

// OpenAI API configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route to create link token
app.post("/create-link-token", async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: "user-id", // Replace with actual user ID from your database
      },
      client_name: "BetSmart Invest",
      products: ["auth", "transactions"],
      country_codes: ["US"],
      language: "en",
      webhook: "https://webhook.example.com",
    });

    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error(
      "Error creating link token:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("An error occurred");
  }
});

// Route to exchange public token for access token
app.post("/exchange-public-token", async (req, res) => {
  try {
    const { public_token } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error(
      "Error exchanging public token:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("An error occurred");
  }
});

// Endpoint: Get Transactions
app.post("/get-transactions", async (req, res) => {
  const { access_token } = req.body;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
  const endDate = new Date();

  // Gambling-related MCC codes
  const gamblingMCCCodes = ["7995", "7800", "7801", "7802", "5816", "7994"];

  try {
    // Fetch transactions from Plaid
    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });

    // Apply MCC filtering
    const gamblingTransactions = response.data.transactions.filter((tx) => {
      const mccMatch = tx.name.match(/MCC:(\d+)/);
      return mccMatch && gamblingMCCCodes.includes(mccMatch[1]);
    });

    res.json({ transactions: gamblingTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error.response?.data || error.message);
    res.status(500).send("Error fetching transactions");
  }
});

// Route: Generate AI Insights
app.post("/generate-insights", async (req, res) => {
  const { transactions } = req.body;

  try {
    const messages = [
      {
        role: "system",
        content: "You are a financial assistant specialized in gambling prevention strategies.",
      },
      {
        role: "user",
        content: `Analyze the following transaction data and generate personalized gambling prevention insights:\n\n${JSON.stringify(
          transactions
        )}\n\nProvide concise actionable insights in plain English, including spending trends, limits, and strategies to reduce gambling.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
    });

    const insights = response.choices[0].message.content.trim();
    res.json({ insights: insights.split("\n").filter((line) => line) });
  } catch (error) {
    console.error("Error generating insights:", error.message);

    // Send a detailed JSON error response to the frontend
    res.status(500).json({
      error: true,
      message: "Error generating insights",
      details: error.message,
    });
  }
});

// Default route to serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

