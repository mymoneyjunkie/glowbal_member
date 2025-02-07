const express = require("express");

const axios = require("axios");

const router = express.Router();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Stripe = require("./stripe");

const { body, validationResult } = require("express-validator");

const FormData = require("form-data");

const crypto = require("crypto");

const qs = require('qs');

const requestIp = require("request-ip");

const baseUrl = "https://glowbal.co.uk/api/";

const isAuth = require("../middleware/is_auth");

router.get("/login", async (req, res, next) => {
  try {
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    // console.log(req.ip);
    // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

    return res.render("login", {
      title: "Login",
      errorMessage: message,
      auth: false,
      oldInput: {
        email: "",
      },
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/register", async (req, res, next) => {
  try {
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    // console.log(req.ip);
    // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

    return res.render("register", {
      title: "Register",
      errorMessage: message,
      auth: false,
      oldInput: {
        name: "",
        email: "",
        image: "",
      },
    });
  } catch (error) {
    console.log(error);
  }
});

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
  ],
  async (req, res, next) => {
    try {
      // console.log(req.body);

      const { password } = req.body;
      
      const error = validationResult(req);

      if (!error.isEmpty()) {
        // console.log(error.array());
        let msg1 = error.array()[0].msg;

        return res.render("login", {
          title: "Login",
          errorMessage: msg1,
          auth: false,
          oldInput: {
            email: req.body.email,
          },
        });
      } else {
        const email = req.body.email.toLowerCase();
        
        let data = new FormData();
        data.append("email", email);
        data.append("password", password);

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: baseUrl + "auth/login.php",
          headers: {
            ...data.getHeaders(),
          },
          data: data,
        };

        const response = await axios.request(config);

        // console.log(response.data);

        if (response.data.isSuccess) {
          // const encrypted = encrypt(email);

          // console.log(encrypted.encrypted);

          return res.redirect(`/show?g=${email}`);
        } else {
          req.flash("error_msg", "Invalid email and password... Try again...");
          return res.redirect("/login");
        }
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/login");
    }
  }
);

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid user name"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
    body("cpassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      const { password, cpassword, name, image } = req.body;
      
      // console.log(req.body);

      const error = validationResult(req);

      if (!error.isEmpty()) {
        // console.log(error.array());
        let msg1 = error.array()[0].msg;

        return res.render("register", {
          title: "Register",
          errorMessage: msg1,
          auth: false,
          oldInput: {
            name: name,
            email: req.body.email,
            image: image,
          },
        });
      } else {
        const clientIp = requestIp.getClientIp(req);
        
        // console.log(req.body, clientIp);
        
      const email = req.body.email.toLowerCase();

        let data = JSON.stringify({
          email: email,
          password: password,
          name: name,
          image: image,
          ip_address: clientIp,
        });
        
        // console.log(data);

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: baseUrl + "auth/register.php",
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };

        const response = await axios.request(config);

        // console.log(response.data);

        if (response.data.isSuccess) {
          // const encrypted = encrypt(email);
          // console.log(email);

          return res.redirect(`/home?m=${email}`);
        } else {
          req.flash("error_msg", "Try again...");
          return res.redirect("/register");
        }
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/register");
    }
  }
);

router.get("/forget", async (req, res, next) => {
  try {    
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    // console.log(req.ip);
    // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

    return res.render("forget", {
      title: "Forget Password",
      errorMessage: message,
      auth: false,
      link: "/forget",
      oldInput: {
        email: ""
      },
    });
  }
  
  catch(error) {
    console.log("Get Forget Password error: ", error);
  }
})

// router.get("/verify", async (req, res, next) => {
//   try {    
//     const encrypted = req.query.email != undefined ? req.query.email.trim().toLowerCase() : '';
    
//     let message = req.flash("error");
//     // console.log(message);

//     if (message.length > 0) {
//       message = message[0];
//     } else {
//       message = null;
//     }
    
//     // console.log(req.ip);
//     // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

//     return res.render("forget", {
//       title: "Forget Password",
//       errorMessage: message,
//       auth: false,
//       link: "/verify",
//       oldInput: {
//         email: encrypted
//       },
//     });
//   }
  
//   catch(error) {
//     console.log("Get Forget Password error: ", error);
//   }
// })

router.post(
  "/forget",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email address, try again..."),
  ],
  async (req, res, next) => {
    try {
      console.log(req.body.email);

      const error = validationResult(req);
      
      if (!error.isEmpty()) {
        console.log(error.array());

        return res.render("forget", {
          title: "Forget Password",
          errorMessage: error.array()[0].msg,
          auth: false,
          link: "/forget",
          oldInput: {
            email: req.body.email
          },
        });
      } 
      
      else {
        const email = req.body.email.toLowerCase();
        
        // let data = new FormData();
        // data.append("email", email);
        
        let data = qs.stringify({
          'email': email 
        });

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: "https://lakewealth.glitch.me/forget",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: data
        };

        const response = await axios.request(config);

        console.log(response.data);

        if (response.data?.success) {
          let config1 = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://glowbal.co.uk/api/auth/forget.php',
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data : data
          };
          const response1 = await axios.request(config1);
          
          return res.render("template", {
            title: "Forget Password",
            text: `We sent a password reset email to ${email.split('@')[0].slice(0, 3) + '...' + email.substring(email.indexOf('@'))}. Please check your email...`,
          })
          
        } else {
          req.flash("error_msg", "Invalid email found. Try again...");
          return res.redirect("/forget");
        }
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/verify");
    }
  }
);

// router.post(
//   "/verify",
//   [
//   	body('email')
// 			.trim()
// 			.notEmpty()
// 			.withMessage('Email Address required')
// 			.normalizeEmail()
// 			.isEmail()
// 			.withMessage('Invalid email'),
//     body('onumber')
// 			.trim()
// 			.notEmpty()
// 			.withMessage('OTP required')
// 			.isLength({max: 6, min: 6})
// 			.withMessage('contains 6 numbers only')
// 			.matches(/^[0-9]+$/)
// 			.withMessage('must be a valid otp'),
//   ],
//   async (req, res, next) => {
//     try {
//       // console.log(req.body);
      
//       const error = validationResult(req);

//       if (!error.isEmpty()) {
//         // console.log(error.array());

//         return res.render("forget", {
//           title: "Forget Password",
//           errorMessage: error.array()[0].msg,
//           auth: false,
//           link: "/verify",
//           oldInput: {
//             email: req.body.email
//           },
//         });
//       } 
      
//       else {
//         const email = req.body.email.toLowerCase();
        
//         let data = new FormData();
//         data.append('email', email);
//         data.append('number', req.body.onumber);

//         let config = {
//           method: 'post',
//           maxBodyLength: Infinity,
//           url: baseUrl + 'auth/verify.php',
//           headers: { 
//             ...data.getHeaders()
//           },
//           data : data
//         };

//         const response = await axios.request(config);

//         // console.log("verify otp", response.data);

//         if (response.data?.isSuccess) {
//           return res.redirect(`/change_pass?email=${email}`);
//         } else {
//           req.flash("error_msg", "Failed. Try again...");
//           return res.redirect("/forget");
//         }
//       }
//     } catch (error) {
//       console.log(error);
//       return res.redirect("/forget");
//     }
//   }
// );

router.get("/change_pass", async (req, res, next) => {
  try {    
    let message = req.flash("error");
    // console.log(message);
    
    // console.log(req.query);
    
    // const encrypted = req.query.email != undefined ? req.query.email.trim().toLowerCase() : '';
    const encrypted = req.query.m != undefined ? req.query.m.trim().toLowerCase() : '';

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    // console.log(req.ip);
    // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);
    
    if (!req.query.token && 
        req.query.token != 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzM4Njc2OTc4LCJleHAiOjE3Mzg2NzcwMzh9.4R-CRHqctw5wShgFHeakMLvnwdyuT6A-slQNZIuQEs0') {
      return res.redirect("/");
    }
    
    else {
      return res.render("verify", {
        title: "Forget Password",
        errorMessage: message,
        auth: false,
        email: encrypted
      });
    }
  }
  
  catch(error) {
    console.log("Get Forget Password error: ", error);
  }
})

router.post("/change_pass",
  [
    body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
    body("cpassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    const { email, password } = req.body;
  
    // console.log(email, password);
  
    const error = validationResult(req);

      if (!error.isEmpty()) {
        // console.log(error.array());

        return res.render("verify", {
          title: "Forget Password",
          errorMessage: error.array()[0].msg,
          auth: false,
          email: email
        });
      }
  
      else {
        let data = new FormData();
        data.append('email', email);
        data.append('password', password);

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: baseUrl + 'auth/updatePassword.php',
          headers: { 
            ...data.getHeaders()
          },
          data : data
        };

        axios.request(config)
        .then((response) => {
          // console.log(JSON.stringify(response.data));
          if (response.data?.isSuccess) {
            return res.redirect("/login");
          } else {
            req.flash("error_msg", "Failed. Try again...");
            return res.redirect("/forget");
          }
        })
        .catch((error) => {
          console.log(error);
          req.flash("error_msg", "Failed to change password. Try Again...");
          return res.redirect("/login");
        });
      }
  }
)

router.get("/show", async (req, res, next) => {
  try {
    const encrypted = req.query.g != '' ? req.query.g.trim().toLowerCase() : null;

    // const decrypted = decrypt(encrypted, key, iv);

    // console.log(decrypted);

    res.cookie("_prod_email", encrypted);

    const customer = await stripe.customers.list({
      email: encrypted,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
      });

      // console.log(subscriptions?.data);

      if (subscriptions?.data && subscriptions?.data.length >= 1) {
        const isTrial = subscriptions?.data.map(
          (i) => i.status == "trialing" || i.status == "active"
        );

        // console.log(isTrial);

        if (isTrial.includes(true)) {
          return res.render("show", {
            title: "Show",
            isSuccess: true,
            video: "",
          });
        } else {
          return res.redirect("/plans");
        }
      } else {
        return res.redirect("/plans");
      }
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/plan");
  }
});

router.get("/home", async (req, res, next) => {
  try {
    const m = req.query.m || req.cookies._prod_email;
    // console.log(m);

    res.cookie("_prod_email", m);

    const customer = await stripe.customers.list({
      email: m.toLowerCase(),
    });
    const customerId = customer.data[0]?.id;
    // console.log(customerId, !customerId);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Please register...");

      return res.redirect("/register");
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
      });
      
      const cancelPromises = subscriptions.data
        .filter(
          (i) => i.status !== "canceled" && i.status !== "active" && i.status !== "paused"
        )
        .map((i) =>
          stripe.subscriptions.cancel(i.id)
            .then(() => {
              console.log(`Subscription ${i.id} with status ${i.status} has been canceled.`);
            })
            .catch((error) => {
              console.error(`Failed to cancel subscription ${i.id}:`, error.message);
            })
      );

     const x = await Promise.all(cancelPromises);
      
      // console.log(x);

      return res.render("home", {
        title: "HOME",
        isSuccess: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .send("Sorry there has been a issue....... Kindly refresh the page");
  }
});

router.get("/plans", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
      email: req.cookies._prod_email,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    } else {
      const products = await stripe.products.list({
        active: true,
      });

      // console.log(products.data);

      const prices = await stripe.prices.list({
        active: true,
      });

      // console.log(prices.data);

      const plans = products.data
        .map((product, index) => {
          const matchingPrice = prices.data.find(
            (price) => price.id === product.default_price
          );
          return {
            // product_id: product.id,
            // price_id: matchingPrice.id,
            id: index + 1,
            name: product?.name,
            description: product?.description,
            amount: matchingPrice?.unit_amount_decimal,
            interval: matchingPrice?.recurring.interval,
            interval_count: matchingPrice?.recurring.interval_count,
          };
        })
        .reverse();

      // console.log(plans);

      // const pricePromises = products.data.map(async (product) => {
      //     return await stripe.prices.retrieve(product.default_price);
      // });

      // Use Promise.all to wait for all price retrievals to complete
      // const prices = await Promise.all(pricePromises);

      // console.log(prices);

      return res.render("products", {
        title: "PLANS",
        plans,
      });
    }
  } catch (error) {
    console.log(error);

    return res.redirect("/home");
  }
});

router.get("/subscribe", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
      email: req.cookies._prod_email,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect(`/?m=${req.cookies._prod_email}`);
    } else {
      const plan = req.query.plan || "";

      let priceID;

      // switch (plan.toLowerCase()) {
      //   case "starter":
      //     priceID = "price_1QfcQQFKDWRw6RCINFPnbZ5Y";
      //     break;
      //   case "pro":
      //     priceID = "price_1QfcRSFKDWRw6RCIljG1GDI5";
      //     break;
      //   case "premium":
      //     priceID = "price_1QfhR0FKDWRw6RCI0v9MXT25";
      //   break;
      //   default:
      //     return res.redirect("/plans");
      // }

      switch (plan.toLowerCase()) {
        case 'starter':
          priceID = 'price_1QNWPs04uO8CoMBs9CkJJ6cH';
          break;
        case 'pro':
          priceID = 'price_1QNWQu04uO8CoMBsSRkcfHVJ';
          break;
        case 'premium':
          priceID = 'price_1QNWRv04uO8CoMBsatjwhSbc';
          break;
        default:
          return res.redirect("/plans");
      }
      
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
      });

      // const alreadySubscribed = subscriptions.data.some((sub) =>
      //   sub.items.data.some((item) => item.price.id == priceID)
      // )
      
      // console.log(subscriptions.data[0].items);
      // console.log("already subscribed: ", alreadySubscribed);
      
      if (subscriptions.data.length >= 1) {
        return res.redirect(`/show?g=${req.cookies._prod_email}`);
      }
      
      else {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer: customerId,
            line_items: [
              {
                price: priceID,
                quantity: 1,
              },
            ],
            // subscription_data: {
            //   trial_period_days: 7,
            // },
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });

        // console.log(session);

        return res.redirect(session.url);
      }
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/plans");
  }
});

router.get("/success", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
      email: req.cookies._prod_email,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect("/home");
    } else {
      const session_id = req.query.session_id || "";

      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription", "subscription.plan.product", "invoice"],
      });

      // console.log(JSON.stringify(session.invoice));

      return res.redirect(`/show?g=${req.cookies._prod_email}`);

      // return res.render("success", {
      //   title: "SUCCESS",
      //   cID: session.customer
      // })
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/plans");
  }
});

router.get("/cancel", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
      email: req.cookies._prod_email,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect("/home");
    } else {
      // return res.send("Sorry you are not subscribed...");
      return res.render("cancel", {
        title: "Failed",
      });
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/plans");
  }
});

router.get("/customer/:customerID", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
      email: req.cookies._prod_email,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect("/home");
    } else {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: req.params.customerID,
        return_url: `${process.env.BASE_URL}/subscriptions`,
      });

      // console.log(portalSession);

      return res.redirect(portalSession.url);
    }
  } catch (error) {
    console.log(error);

    return res.redirect("/home");
  }
});

router.get("/subscriptions", async (req, res, next) => {
  try {
    const m = req.query.m || req.cookies._prod_email;
    
    // console.log(m);

    res.cookie("_prod_email", m);

    const customer = await stripe.customers.list({
      email: m.toLowerCase(),
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
      });

      // console.log(subscriptions);

      if (subscriptions?.data.length >= 1) {
        const subscriptionDetailsPromises = subscriptions.data.map(
          async (subscription) => {
            // console.log(subscription.status);
            // Check if the subscription status is not 'canceled'
            if (subscription.status !== "canceled" 
                && subscription.status !== "incomplete" 
                && subscription.status !== "incomplete_expired"
            ) {
                // Process the items of the subscription if it's not canceled
                const itemDetailsPromises = subscription.items.data.map(
                  async (item) => {
                    const productId = item.plan.product;

                    // Fetch the product and its associated prices concurrently
                    const [product, prices] = await Promise.all([
                      stripe.products.retrieve(productId),
                      stripe.prices.list({ product: productId }), // Get all prices for the product
                    ]);

                    // Step 4: Find the matching price by comparing with the product's default price
                    const matchingPrice = prices.data.find(
                      (price) => price.id === product.default_price
                    );

                    // Step 5: Return the details for the subscription item if a match is found
                    if (matchingPrice) {
                      return {
                        subscription_id: subscription.id,
                        subscription_status: subscription.status,
                        product_name: product?.name,
                        product_description: product?.description,
                        amount: matchingPrice?.unit_amount_decimal, // Price in decimal format
                        interval: matchingPrice?.recurring?.interval, // Recurring billing interval (if applicable)
                        interval_count: matchingPrice?.recurring?.interval_count, // Interval count (if applicable)
                      };
                    } else {
                      return null; // Handle case where no matching price is found
                    }
                  }
                );

                // Filter out null values if no matching price is found for any item
                const validItemDetails = (
                  await Promise.all(itemDetailsPromises)
                ).filter((item) => item !== null);

                // console.log(validItemDetails);

                return {
                  subscription_id: subscription.id,
                  subscription_status: subscription.status,
                  product_name: validItemDetails[0].product_name,
                  product_description: validItemDetails[0].product_description,
                  amount: validItemDetails[0].amount,
                  interval: validItemDetails[0].interval,
                  interval_count: validItemDetails[0].interval_count,
                };
              } 
            else {
                // Return null or an empty object if subscription is canceled
                return null;
            }
          }
        );

        // Step 6: Wait for all subscription details to resolve
        const allSubscriptionDetails = (
          await Promise.all(subscriptionDetailsPromises)
        ).filter((subscription) => subscription !== null);

        // Flatten the array (because we have an array of arrays)
        const flatSubscriptionDetails = allSubscriptionDetails.flat();

        // console.log(flatSubscriptionDetails);

        // Step 7: Log the subscription details or process further
        // flatSubscriptionDetails.forEach(details => {
        //   console.log('Subscription Item Details:', details);
        // });

        if (flatSubscriptionDetails.length >= 1) {
          return res.render("subs1", {
            title: "SUBSCRIPTIONS",
            plans: flatSubscriptionDetails,
          });
        } else {
          return res.redirect("/plans");
        }
      } else {
        return res.redirect("/plans");
      }
    }
  } catch (error) {
    console.log(error);

    return res.redirect("/home");
  }
});

router.post("/cancel_subscription", async (req, res, next) => {
  try {
    const { s_id } = req.body;

    const customer = await stripe.customers.list({
      email: req.cookies._prod_email,
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email, s_id);

    if (!customerId && !s_id) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    } else {
      const subscription = await stripe.subscriptions.cancel(s_id);

      return res.redirect("/subscriptions");
    }
  } catch (error) {
    console.log(error);

    return res.redirect("/home");
  }
});

router.get("/resume_subscription", async (req, res, next) => {
  try {
    const m = req.query.m || req.cookies._prod_email;
    // console.log(m);

    res.cookie("_prod_email", m);

    const customer = await stripe.customers.list({
      email: m.toLowerCase(),
    });
    const customerId = customer.data[0]?.id;
    // console.log(m, customerId);

    if (!customerId) {
      req.flash("error_msg", "Customer not found! Try Again...");

      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
      });
      
      const avaiableSubscriptions = subscriptions.data ? subscriptions.data
                .filter(i => i.status !== "canceled" && i.status !== "unpaid" && i.status !== "incomplete" && i.status !== "incomplete_expired" && i.status !== "trialing")
                .map(i => i) : '';
      // console.log(avaiableSubscriptions);
      
      if (avaiableSubscriptions.length >= 1) {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.BASE_URL}/subscriptions`,
        });

        return res.redirect(session?.url);
      }
      else {
        return res.redirect("/plans")
      }
    }
  } catch (error) {
    console.log(error);

    return res.redirect("/home");
  }
});

router.get("/videos", isAuth, async (req, res, next) => {
  try {
    const m = req.cookies._prod_email;
    // console.log(m);

    const customer = await stripe.customers.list({
      email: m,
    });
    const customerId = customer.data[0]?.id;
    // console.log(customerId);
    
    let data = new FormData();
    data.append('offset', '0');

    if (customerId) {
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://glowbal.co.uk/api/get/home.php',
        headers: { 
          ...data.getHeaders()
        },
        data : data
      };

      const response = await axios.request(config);
      // console.log(response.data);
      
      return res.render("carousel", {
        title: "VIDEOS",
        isSuccess: true,
        data: response.data
      });
    } else {
      req.flash("error", "Invalid User... Login again");

      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/login");
  }
})

router.get("/play/:id", isAuth, async (req, res, next) => {
  try {
    const m = req.cookies._prod_email;
    // console.log(m);
    
    const {id} = req.params;

    const customer = await stripe.customers.list({
      email: m,
    });
    const customerId = customer.data[0]?.id;
    // console.log(customerId);
    
    // console.log(id, typeof id, typeof id == 'number');

    if (customerId && id) { // Example: must be a positive integer
      return res.render("video", {
        title: "VIDEO",
        isSuccess: true,
        play: id
      });
    } else {
      req.flash("error", "Invalid User... Login again");

      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/login");
  }
});

router.get("/logout", async (req, res, next) => {
  req.session.destroy((err) => {
    // console.log(err);
    res.clearCookie("_prod_email");
    return res.redirect("/login");
  });
});

router.post("/getStatus",
  [
    body('email')
      .trim()
	    .notEmpty()
	    .withMessage("Email required")
      .isEmail()
      .withMessage('Please enter a valid email address'),
  ],
  async (req, res, next) => {
    try {
      const email = req.body.email.toLowerCase();

      // console.log(email);
      
      const error = validationResult(req);

	    if (!error.isEmpty()) {
				// console.log(error.array());
        return res.json({
            "isCustomerExist": false,
            "error Msg": "Please enter a valid email"
        })
      }
      
      else {
        const customer = await stripe.customers.list({
          email: email,
        });
        const customerId = customer.data[0]?.id;

        // console.log(customerId);

        if (!customerId) {
          return res.json({
            "isCustomerExist": false,
            "error Msg": "No customer found with this email"
          })
        } 

        else {
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
          });

          // console.log(subscriptions?.data);

          if (subscriptions?.data && subscriptions?.data.length >= 1) {
            const isTrial = subscriptions?.data
              .filter((i) => i.status === "trialing" || i.status === "active" 
                    || i.status === "canceled" || i.status === "past_due"
                      || i.status === "incomplete" || i.status === "incomplete_expired"
                    || i.status === "unpaid" || i.status === "paused")
              .map((i) => ({ status: i.status, ...i }));

            // console.log(isTrial);

            if (isTrial && isTrial[0].status == "active" || isTrial[0].status == "trialing") {
              return res.json({
                "isCustomerExist": true,
                "isSubActive": isTrial[0].status == 'active' || isTrial[0].status == 'trialing'? true : false,
                "start_date": isTrial[0].current_period_start,
                "end_date": isTrial[0].current_period_end,
                "subId": isTrial[0].id
              })
            }

            else {
              return res.json({
                "isCustomerExist": true,
                "isSubActive": false
              })
            }
          }

          else {
              return res.json({
                "isCustomerExist": true,
                "isSubActive": false
              })
          }
        }
      }
    }

    catch(error) {
      console.log("get status page error: ", error);
    }
  }
)

// router.post("/resume_subscription", async (req, res, next) => {
//     try {
//       const { s_id } = req.body;

//       const customer = await stripe.customers.list({
//           email: req.cookies._prod_email
//       })
//       const customerId = customer.data[0]?.id;

//       // console.log(customerId, req.cookies._prod_email);

//       if (!customerId && !s_id) {
//         req.flash('error_msg', 'Customer not found! Try Again...');

//         return res.redirect(`/?m=${req.cookies._prod_email}`);
//       }

//       else {
//         const subscription = await stripe.subscriptions.resume(
//           s_id,
//           {
//             billing_cycle_anchor: 'now',
//           }
//         );

//         return res.redirect("/subscriptions");
//       }
//     }

//     catch(error) {
//        console.log(error);

//       return res.redirect("/");
//    }
// })

module.exports = router;
