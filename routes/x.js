const express = require("express");

const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.get("/test1", async (req, res, next) => {
  try {
    // Function to introduce a delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function updateAllEmailsToLowercase() {
        let hasMore = true;
        let startingAfter = null;

        while (hasMore) {
            try {
                // Prepare the parameters for the API call
                const params = {
                    limit: 100,
                };
                if (startingAfter) {
                    params.starting_after = startingAfter; // Include only if it's not null
                }

                // Fetch customers with pagination
                const customers = await stripe.customers.list(params);

                for (const customer of customers.data) {
                  let data = new FormData();
                  data.append('email', customer.email);

                  let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://glowbal.co.uk/api/insert/stripe_email.php',
                    headers: { 
                      ...data.getHeaders()
                    },
                    data : data
                  };
                  
                  const response = await axios.request(config);
                  
                  console.log(response.data);
                        // const updatedCustomer = await stripe.customers.update(
                        //   customer.id,
                        //   {
                        //     email: customer.email.toLowerCase() // Convert email to lowercase
                        //   }
                        // );
                        // console.log(`Updated email for customer ${customer.id}: ${updatedCustomer.email}`);

                    // Delay for 500 milliseconds before the next update
                    await delay(500);
                }

                // Check if there are more customers to fetch
                hasMore = customers.has_more;
                if (hasMore) {
                    startingAfter = customers.data[customers.data.length - 1].id; // Set the starting point for the next request
                }
            } catch (error) {
                console.error('Error updating emails:', error);
                break; // Exit the loop on error
            }
        }
    }

    updateAllEmailsToLowercase();

    
    
    
    // async function updateCustomersEmails() {
      // List customers, 100 per page (you can adjust the `limit`)
//       const customers = await stripe.customers.list({
//         limit: 100
//       });
            
//       const nextPageCustomers = await stripe.customers.list({
//         limit: 200,
//         starting_after: customers.data[customers.data.length - 1].id  // Use the last customer's ID
//       });
      
      // console.log(nextPageCustomers.data.length);

//       // Loop through the customers
//       for (const customer of nextPageCustomers.data) {
//         // console.log(customer);
        // const updatedCustomer = await stripe.customers.update(
        //   customer.id,
        //   {
        //     email: customer.email.toLowerCase() // Convert email to lowercase
        //   }
        // );
        // console.log(`Updated email for customer ${customer.id}: ${updatedCustomer.email}`);
//       }

//       return res.send("success...");
//     }

//     updateCustomersEmails();
  }
  
  catch (error) {
    console.log("test1 error: ", error);
  }
})

module.exports = router;