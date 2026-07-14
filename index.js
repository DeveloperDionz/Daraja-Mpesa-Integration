const express = require("express");

const app = express();
require("dotenv").config();
const cors = require("cors");
const axios = require("axios");
const mongoose = require('mongoose');
const port = process.env.PORT;
const Payment = require("./models/paymentModel");

app.listen(port, () => {
    console.log(`App running on port: ${port}`);
});


mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("database connected successfully");
})
.catch((err)=> {
    console.log(err.message);
})

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors());

app.get("/", (req, res) => {
    res.send("<h1>Hello World!</h1>");
});

/*app.get("/token", (req, res) => {
    generateToken();
})*/
const generateToken = async (req, res, next) =>{

    const secret = process.env.MPESA_CONSUMER_SECRET;
    const consumerKey = process.env.MPESA_CONSUMER_KEY;

    const auth = new Buffer.from(`${consumerKey}:${secret}`).toString("base64");

    await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",{
        headers: {
            authorization : `Basic ${auth}`
        },
    }
    ).then((response) => {
        //console.log(response.data.access_token);
        token = response.data.access_token;
        next();
    }).catch((err) => {
        console.log(err);
        //res.status(400).json(err.message);
    });
};

//middleware function to generate token

app.post("/stk", generateToken, async (req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;

    const date = new Date();
    const timestamp = 
     date.getFullYear() +
     ("0" + (date.getMonth() + 1)).slice(-2) +
     ("0" + date.getDate()).slice(-2) +
     ("0" + date.getHours()).slice(-2) +
     ("0" + date.getMinutes()).slice(-2) +
     ("0" + date.getSeconds()).slice(-2);

     const shortcode = process.env.MPESA_PAYBILL;
     const passkey = process.env.MPESA_PASSKEY;
     const password = new Buffer.from(shortcode + passkey + timestamp).toString("base64");


    await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
  "BusinessShortCode": process.env.MPESA_PAYBILL,
  "Password": password,
  "Timestamp": timestamp,
  "TransactionType": "CustomerPayBillOnline",
  "Amount": amount,
  "PartyA": `254${phone}`,
  "PartyB": shortcode,
  "PhoneNumber": `254${phone}`,
  "CallBackURL": "https://spotlight-fedora-overbite.ngrok-free.dev/callback",
  "AccountReference": `254${phone}`,
  "TransactionDesc": "txndesc"
},
 {
    headers: {
        Authorization: `Bearer ${token}`,
    },
 }
    ).then((data) =>{
        console.log(data.data)
        res.status(200).json(data.data)
    }).catch((err) => {
        console.log(err.message)
        res.status(400).json(err.message)
    })
});

app.post("/callback", (req, res) => {
    const callbackData = req.body;
    console.log(callbackData.Body);
    if (!callbackData.Body.stkCallback.CallbackMetadata) {
        console.log(callbackData.Body);
        return res.json("ok");
    }

    //console.log(callbackData.Body.stkCallback.CallbackMetadata);

    const phone = callbackData.Body.stkCallback.CallbackMetadata.Item[4].Value;
    const amount = callbackData.Body.stkCallback.CallbackMetadata.Item[0].Value;
    const trnx_id = callbackData.Body.stkCallback.CallbackMetadata.Item[1].Value;

    console.log({ phone, amount, trnx_id });

    const payment = new Payment({
        number: phone,
        trnx_id: trnx_id,
        amount: amount,
    });

    payment.number = phone;
    payment.trnx_id = trnx_id;
    payment.amount = amount;

    payment.save()
    .then((data) => {
        console.log({ message: "Payment saved successfully", data });
    })
    .catch((err) => {
        console.log({message: "Error saving payment:", err});
    });
});