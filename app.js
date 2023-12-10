require("dotenv").config();

const Mexc = require("./package/"); // Adjust the path to point to the dist/js folder
const apiKey = process.env.MEXC_API_KEY;
const apiSecret = process.env.MEXC_API_SECRET;

// Instantiate the client for the Spot API
const client = new Mexc.Spot(apiKey, apiSecret);
const tradingPair = "DRFUSDT"; // Replace with your desired trading pair
const orderSize = 4000; // Set the order size

async function cancelOpenLimitOrders() {
  try {
    // Fetch current open orders
    const openOrders = await client.openOrders(tradingPair);

    // Cancel each open limit order
    for (const order of openOrders) {
      if (order.type === "LIMIT") {
        await client.cancelOrder(tradingPair, { orderId: order.orderId });
      }
    }
  } catch (error) {
    console.error(`Error occurred while canceling orders: ${error.message}`);
  }
}

async function trade() {
  try {
    // Cancel any open limit orders before placing new ones
    await cancelOpenLimitOrders();

    // Fetch the order book for the trading pair using the client
    const orderBook = await client.depth(tradingPair, { limit: 5 });

    // Extract the top buy and sell prices
    const topBuyPrice = parseFloat(orderBook.bids[0][0]);
    const topSellPrice = parseFloat(orderBook.asks[0][0]);

    // Calculate a random price between topBuyPrice and topSellPrice, leaning towards topBuyPrice
    const randomPrice =
      topBuyPrice + Math.random() * (topSellPrice - topBuyPrice) * 0.1;

    // Place a limit sell order
    await client.newOrder(tradingPair, "SELL", "LIMIT", {
      price: randomPrice.toFixed(8),
      quantity: orderSize,
    });

    // Place a limit buy order
    await client.newOrder(tradingPair, "BUY", "LIMIT", {
      price: randomPrice.toFixed(8),
      quantity: orderSize,
    });

    console.log(
      `Placed sell and buy orders at price: ${randomPrice.toFixed(8)}`
    );
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
  }
}

// Execute the trade function every 30 seconds
setInterval(trade, 30000);
