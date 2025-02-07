const express = require("express");

const dotenv = require('dotenv');
dotenv.config();

const session = require('express-session');

const flash = require('connect-flash');

const cookieParser = require('cookie-parser');

const app = express();

const path = require("path");

const PORT = process.env.PORT || 3000;

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.ENDPOINT_SECRET;

const adminRoute = require("./routes/admin");
const xRoute = require("./routes/x");

app.set("view engine", "ejs");
app.set("views", 'views');

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

// Session middleware
app.use(session({
  secret: 'jefjwegj@!*&%^*%(1234#',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none", httpOnly: true },
}));

// Flash middleware
app.use(flash());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.session.name = req.cookies._prod_email || '';
  next();
})

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

let processedSessions = new Set();

// Match the raw body to content type application/json
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  }
  catch (err) {
    // console.log("first", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // console.log(event.type);
  
  // if (processedSessions.has(event.data.object.id)) {
  //   return res.json({ received: true });
  // }
  
    if (processedSessions.has(event.id)) {
      console.log(`Duplicate event received: ${event.id}`);
      return res.json({ received: true });
    }
    processedSessions.add(event.id);
  
  
  try {
    const { type, data } = event;
    let session = data.object;
    let customerId = session.customer || null;

    // Handle the event
    switch (event.type) {  
      case 'checkout.session.async_payment_failed':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('failed...');
          break;
      case 'checkout.session.async_payment_succeeded':
          // session = event.data.object;
          // console.log('PaymentMethod was attached to a Customer!');
          console.log('succeed');
          break;
        // ... handle other event types
      case 'checkout.session.completed':
          // session = event.data.object;
          console.log(`completed ${customerId}`);
          break;
      case 'checkout.session.expired':
          // session = event.data.object;
          console.log('expired');
          break;

      case 'customer.bank_account.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer bank_account created...');
          break;
      case 'customer.bank_account.deleted':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer bank_account deleted...');
          break;
      case 'customer.bank_account.updated':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer bank_account updated...');
          break;
      case 'customer.card.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer card created...');
          break;
      case 'customer.card.deleted':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer card deleted...');
          break;
      case 'customer.card.updated':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer card updated...');
          break;
      case 'customer.subscription.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer subscription created...');
          break;
      case 'customer.subscription.deleted':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer subscription deleted...');
          break;
      case 'customer.subscription.paused':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer subscription paused...');
          break;
      case 'customer.subscription.resumed':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer subscription resumed...');
          break;
      case 'customer.subscription.trial_will_end':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer subscription trial_will_end...');
          break;
        
      case 'customer.subscription.updated':
        try {
          // console.log("customer.subscription.updated: ", session);
          const subscriptionId = session.id;
          customerId = session.customer;

          if (!subscriptionId) {
            console.log('customer.subscription.updated No subscription in session');
            break;
          }

          // Prevent duplicate processing
          if (processedSessions.has(event.id)) {
            console.log(`Duplicate event: ${event.id}`);
            break;
          }
          processedSessions.add(event.id);

          // Retrieve the subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // console.log(subscription);

          // Check if cancel_at_period_end is already configured
          if (!subscription.cancel_at_period_end) {
            const currentPeriodEnd = subscription.current_period_end; // Use the subscription's period end
            const now = Math.floor(Date.now() / 1000);

            if (currentPeriodEnd && now > currentPeriodEnd) {
              await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
              });
              console.log(`Subscription ${subscriptionId} marked for cancellation.`);
            } else {
              console.log(`Subscription ${subscriptionId} is within the current period.`);
            }
          } else {
            console.log(`Subscription ${subscriptionId} is already set to cancel at period end.`);
          }

          console.log(`Customer subscription updated... Customer ID: ${customerId}`);
        } catch (error) {
          console.error(`Error processing subscription update: ${error.message}`);
        }
        break;

      case 'invoice.payment_failed':
        try {
          const subscriptionId = session.id;

          // Prevent duplicate processing
          if (processedSessions.has(event.id)) {
            console.log(`Duplicate event: ${event.id}`);
            break;
          }
          processedSessions.add(event.id);

          // Check if the invoice is unpaid
          if (session.status === 'unpaid') {
            console.log(`Invoice is unpaid. Canceling subscription: ${subscriptionId}`);

            // Cancel the subscription at the end of the billing period
            if (subscriptionId) {
              await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true, // Ensure the subscription ends at the end of the current period
              });
              console.log(`Subscription ${subscriptionId} marked for cancellation at period end.`);
            } else {
              console.log('No subscription ID found for the unpaid invoice.');
            }
          } else {
            console.log(`Invoice ${session.id} is not unpaid. No action taken.`);
          }
          console.log('Customer invoice payment_failed...');
        } catch (error) {
          console.error(`Error processing payment_failed event: ${error.message}`);
        }
      break;

      case 'invoice.created':
        console.log('Customer invoice created...');
        break;
        
      case 'invoice.payment_succeeded':
         try {
             // console.log("invoice.payment_succeeded: ", session);
              const subscriptionId = session.id;
              customerId = session.customer;

              if (!subscriptionId) {
                console.log('invoice.payment_succeeded No subscription in session');
                break;
              }

              // Prevent duplicate processing
              if (processedSessions.has(event.id)) {
                console.log(`Duplicate event: ${event.id}`);
                break;
              }
              processedSessions.add(event.id);

              const subscription = await stripe.subscriptions.retrieve(subscriptionId);

              // Only update if not already configured
              if (!subscription.cancel_at_period_end) {
                const currentPeriodEnd = session.current_period_end;
                const now = Math.floor(Date.now() / 1000);

                if (now > currentPeriodEnd) {
                  await stripe.subscriptions.update(session.id, {
                    cancel_at_period_end: true
                  });
                } else {
                  console.log(`Subscription ${subscriptionId} is within the current period.`);
                }
              } else {
                console.log(`Subscription ${subscriptionId} is already set to cancel at period end.`);
              }
              // console.log('PaymentIntent was successful!');
              console.log('Customer invoice payment_succeeded...');
          } catch (error) {
            console.error(`Error processing subscription update: ${error.message}`);
          }
          break;
      case 'invoice.sent':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer invoice sent...');
          break;
      case 'payment_intent.amount_capturable_updated':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent amount_capturable_updated...');
          break;
      case 'payment_intent.canceled':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent canceled...');
          break;
      case 'payment_intent.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent created...');
          break;
      case 'payment_intent.partially_funded':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent partially_funded...');
          break;
      case 'payment_intent.payment_failed':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent payment_failed...');
          break;
      case 'payment_intent.processing':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent processing...');
          break;
      case 'payment_intent.requires_action':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent requires_action...');
          break;
      case 'payment_intent.succeeded':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payment_intent succeeded...');
          break;
      case 'payout.canceled':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payout canceled...');
          break;
      case 'payout.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payout created...');
          break;
      case 'payout.failed':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payout failed...');
          break;
      case 'payout.paid':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payout paid...');
          break;
      case 'payout.reconciliation_completed':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payout reconciliation_completed...');
          break;
      case 'payout.updated':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer payout updated...');
          break;
      case 'billing.alert.triggered':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer billing alert triggered...');
          break;
      case 'billing_portal.configuration.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer billing_portal configuration created...');
          break;
      case 'billing_portal.configuration.updated':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer billing_portal configuration updated...');
          break;
      case 'billing_portal.session.created':
          // session = event.data.object;
          // console.log('PaymentIntent was successful!');
          console.log('Customer billing_portal session created...');
          break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return res.json({ success: true });
  } catch (error) {
    console.error(`Error processing event: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
});

app.use(adminRoute);
// app.use(xRoute);

app.use('/', (req, res, next) => {
  return res.redirect("/login");
});

// app.use('*', (req, res, next) => {
//   return res.redirect("/login");
// });

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
})