# Daraja M-Pesa Integration

A backend integration for Safaricom's **Daraja API** enabling seamless mobile money payments via **M-Pesa Express (STK Push)**, transaction status queries, and automated payment callback handling.

## Features

* **OAuth 2.0 Authentication:** Automatically generates and refreshes Daraja API bearer access tokens using your Consumer Key and Consumer Secret.
* **M-Pesa Express (STK Push):** Initiates real-time payment prompts directly on a customer's mobile handset (`CustomerPayBillOnline` / `CustomerBuyGoodsOnline`).
* **Asynchronous Callback Handler:** Receives, validates, and processes payment confirmation payloads (`stkCallback`) sent by Safaricom servers.
* **Transaction Status Query (STK Query):** Verifies the status of an initiated STK Push transaction using its `CheckoutRequestID`.
* **Sandbox & Production Ready:** Easily switch between Safaricom sandbox testing and live production environments via environment variables.

## Prerequisites

Before running this project, ensure you have:

1. A developer account on the [Safaricom Developer Portal](https://developer.safaricom.co.ke/).
2. An active app created on the portal to obtain your **Consumer Key** and **Consumer Secret**.
3. Your **Business Shortcode** (Paybill or Till Number) and **Lipa Na M-Pesa Online Passkey**.
4. A publicly accessible HTTPS URL (such as [ngrok](https://ngrok.com/) for local development) to receive Safaricom webhook callbacks.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/DeveloperDionz/Daraja-Mpesa-Integration.git
cd Daraja-Mpesa-Integration
```

### 2. Install Dependencies

Install the required project packages using your runtime's package manager (e.g., `npm install`, `pip install -r requirements.txt`, or `composer install`).

### 3. Configure Environment Variables

Create a `.env` file in the root directory and configure your Safaricom Daraja credentials:

```env
# Environment: sandbox or production
DARAJA_ENV=sandbox

# Safaricom Developer Portal Credentials
DARAJA_CONSUMER_KEY=your_consumer_key_here
DARAJA_CONSUMER_SECRET=your_consumer_secret_here

# Lipa Na M-Pesa Online Credentials
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=your_lipa_na_mpesa_passkey_here
DARAJA_TRANSACTION_TYPE=CustomerPayBillOnline

# Public HTTPS Callback URL
DARAJA_CALLBACK_URL=https://your-domain-or-ngrok-url.ngrok-free.app/api/mpesa/callback
```

### 4. Expose Local Server for Callbacks (Local Testing)

Safaricom requires an HTTPS endpoint to deliver transaction results. If testing locally, expose your local port using ngrok:

```bash
ngrok http 3000
```

Copy the generated `https://` forwarding URL into `DARAJA_CALLBACK_URL` in your `.env` file.

## API Usage

### Initiate STK Push

* **Endpoint:** `POST /api/mpesa/stkpush`
* **Request Body:**

```json
{
  "phone": "2547XXXXXXXX",
  "amount": 100,
  "accountReference": "ORDER-101",
  "transactionDesc": "Payment for Order 101"
}
```

* **Sample Response:**

```json
{
  "MerchantRequestID": "29115-34620561-1",
  "CheckoutRequestID": "ws_CO_191220251020363925",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

### Callback Payload Example

Once the user enters their M-Pesa PIN (or cancels the prompt), Safaricom sends a `POST` request to your configured `DARAJA_CALLBACK_URL`:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220251020363925",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 100.00 },
          { "Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV" },
          { "Name": "TransactionDate", "Value": 20251219102115 },
          { "Name": "PhoneNumber", "Value": 254708374149 }
        ]
      }
    }
  }
}
```

> **Note:** A `ResultCode` of `0` indicates a successful payment. Any non-zero code indicates cancellation, timeout, or insufficient funds.

## Sandbox Testing Reference

When testing in `sandbox` mode on the Safaricom Daraja Portal:

| Parameter | Sandbox Test Value |
| :--- | :--- |
| **Paybill Shortcode** | `174379` |
| **Test MSISDN (Phone)** | `254708374149` |
| **OAuth Endpoint** | `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials` |
| **STK Push Endpoint** | `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest` |
| **STK Query Endpoint** | `https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query` |

## Security Best Practices

* **Never commit your `.env` file** or hardcode your Consumer Key, Consumer Secret, or Passkey in source control.
* Always verify `ResultCode === 0` and validate the `CheckoutRequestID` and `Amount` inside your callback handler before fulfilling orders.
* Use `2547XXXXXXXX` or `2541XXXXXXXX` international phone formatting without a leading `+`.

## License

This project is open-source and available under the [MIT License](LICENSE).