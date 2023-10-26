var express = require('express');
var router = express.Router();
const Invoice = require('../models/Invoice');
const Agent = require('../models/Agent')
const nodemailer = require('nodemailer')
const { spawn } = require('child_process')
router.get('/:invoiceId', async (req, res) => {
    try {
      const invoice = await Invoice.findByPk(req.params.invoiceId);
      console.log(invoice, 'innuuuuuuu');
     
  
      if (!invoice) {
        return res.status(404).send('Invoice not found');
      }
  
      // Extract passport data from the passportData field
      const passportData = invoice.passportData || [];
  
      // Create an object to store passport counts by country
      const passportCountsByCountry = {};
  
      // Create an object to store passport numbers and passenger names by country
      const passportInfoByCountry = {};
  
      passportData.forEach(item => {
        const { country, passportnumber, passengername } = item;
  
        // Check if the country exists in the object, if not, initialize it with a count of 1
        if (!passportCountsByCountry[country]) {
          passportCountsByCountry[country] = 1;
          passportInfoByCountry[country] = [{ passportnumber, passengername }];
        } else {
          // If the country already exists, increment the count and add the passport number and passenger name to the list
          passportCountsByCountry[country]++;
          passportInfoByCountry[country].push({ passportnumber, passengername });
        }
      });
      console.log(passportCountsByCountry, 'Count...............................................')
      console.log(passportInfoByCountry, 'Passport Info....................');
  
      // Fetch the Agent based on some criteria (e.g., ID or other relevant information)
      const agent = await Agent.findOne({
        where: { id: invoice.agent_id },
      });
      console.log(agent, 'agent....................')
  
      if (agent) {
        const rawAgentServiceCharge = agent.servicecharge || [];
        console.log('Raw Agent Service Charge:', rawAgentServiceCharge);
  
        // Filter out entries with totalCount equal to 0
        agentServiceCharge = rawAgentServiceCharge.filter(entry => {
          const { country } = entry;
          const totalCount = passportCountsByCountry[country] || 0;
          return totalCount > 0;
        });
  
        console.log('Filtered Agent Service Charge:', agentServiceCharge);
  
        agentServiceCharge.forEach(entry => {
          const { country, passportnumber } = entry;
  
          // Calculate the total count by checking the quantity for the current passport in passportCountsByCountry
          entry.totalCount = passportCountsByCountry[country] || 0;
  
          // Calculate the total amount by multiplying the price with the quantity
          entry.totalAmount = entry.price * entry.totalCount;
  
          // Include passengername in the entry
          entry.passengerInfo = passportInfoByCountry[country].find(info => info.passportnumber === passportnumber);
        });
  
        console.log(agentServiceCharge, 'charge............');
      }
  
      const overallSubtotal = agentServiceCharge.reduce((acc, entry) => {
        return acc + entry.totalAmount;
      }, 0);
  
      let gstAmount = 0;
      console.log('Is Cash:', invoice.iscash);
      const PassportDatacount= await invoice.passportData.length
      console.log(PassportDatacount,"COUNT>>>>>>>>>>");
      serviceCharges= invoice.servicecharge * PassportDatacount
  
      // Check if is_cash is not equal to 1 (i.e., payment is not made in cash) and calculate the GST amount if necessary
      if (invoice.iscash !== true) {
        // Calculate the GST amount (18% of overallSubtotal) only if is_cash is not equal to true
        gstAmount = 0.18 * serviceCharges;
        gstAmount = parseFloat(gstAmount.toFixed(2));
      }
  
      // Calculate the total service charge
      const totalServiceCharge = agentServiceCharge.reduce((acc, entry) => {
        return acc + entry.price;
      }, 0);
  
      const createdAtDate = new Date(invoice.createdAt);
      const formattedCreatedAt = createdAtDate.toLocaleDateString();
      console.log(formattedCreatedAt, 'date....................');
  
      // Calculate the total amount by adding overallSubtotal, gstAmount, and totalServiceCharge
      const totalAmount = overallSubtotal + gstAmount + parseFloat(serviceCharges || 0);
  
      console.log('GST Amount:', gstAmount);
      console.log('Overall Subtotal:', overallSubtotal);
      console.log('Total Amount:', totalAmount);
     
  
      // Render the invoice template with the passport counts, passport numbers by country, GST amount, total amount, and total service charge
      res.render('invoice', {
        invoice,
        passportCountsByCountry,
        passportInfoByCountry,
        agentServiceCharge,
        iscash: invoice.is_cash,
        gstAmount,
        overallSubtotal,
        totalAmount,
        formattedCreatedAt,
        agent,
        PassportDatacount,
        serviceCharges

      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).send('Internal server error');
    }
  });




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tryoutscout@gmail.com',
        pass: 'xapfekrrmvvghexe',
    },
});
router.get('/send-email/:invoiceId', async (req, res) => {
    try {
        const invoiceId = req.params.invoiceId;

        // Fetch the required data
        const data = await fetchInvoiceData(invoiceId);

        // Generate HTML content for the email
        const emailHtmlContent = generateInvoiceHtml(data);

        // Generate PDF from HTML content using wkhtmltopdf
        const pdfBuffer = await convertHtmlToPdf(emailHtmlContent);

        // Set up email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com', // Your Gmail address
                pass: 'your-app-password', // Use the App Password generated in your Google Account settings
            },
        });

        // Email options
        const mailOptions = {
            from: 'your-email@gmail.com', // Your Gmail address
            to: data.agent.email,
            subject: 'Invoice for Visa Service',
            text: 'Please find the attached PDF invoice.',
            attachments: [
                {
                    filename: 'invoice.pdf',
                    content: pdfBuffer,
                },
            ],
        };
        console.log('mailoption call', mailOptions);

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);

        res.send('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Internal Server Error');
    }
});
async function fetchInvoiceData(invoiceId) {
    try {
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const agent = await Agent.findOne({
            where: { id: invoice.agent_id },
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        const passportData = invoice.passportData || [];
        const passportCountsByCountry = {};
        const passportInfoByCountry = {};

        passportData.forEach(item => {
            const { country, passportnumber, passengername } = item;

            if (!passportCountsByCountry[country]) {
                passportCountsByCountry[country] = 1;
                passportInfoByCountry[country] = [{ passportnumber, passengername }];
            } else {
                passportCountsByCountry[country]++;
                passportInfoByCountry[country].push({ passportnumber, passengername });
            }
        });

        const rawAgentServiceCharge = agent.servicecharge || [];
        const agentServiceCharge = rawAgentServiceCharge.filter(entry => {
            const { country } = entry;
            const totalCount = passportCountsByCountry[country] || 0;
            return totalCount > 0;
        });

        agentServiceCharge.forEach(entry => {
            const { country, passportnumber } = entry;
            entry.totalCount = passportCountsByCountry[country] || 0;
            entry.totalAmount = entry.price * entry.totalCount;
            entry.passengerInfo = passportInfoByCountry[country].find(info => info.passportnumber === passportnumber);
        });

        const overallSubtotal = agentServiceCharge.reduce((acc, entry) => acc + entry.totalAmount, 0);

        let gstAmount = 0;
        console.log('Is Cash:', invoice.iscash);
        const PassportDatacount= await invoice.passportData.length
        console.log(PassportDatacount,"COUNT>>>>>>>>>>");
        serviceChargess= invoice.servicecharge * PassportDatacount
    
        // Check if is_cash is not equal to 1 (i.e., payment is not made in cash) and calculate the GST amount if necessary
        if (invoice.iscash !== true) {
          // Calculate the GST amount (18% of overallSubtotal) only if is_cash is not equal to true
          gstAmount = 0.18 * serviceCharges;
          gstAmount = parseFloat(gstAmount.toFixed(2));
        }
    

        const totalServiceCharge = agentServiceCharge.reduce((acc, entry) => acc + entry.price, 0);
        const createdAtDate = new Date(invoice.createdAt);
        const formattedCreatedAt = createdAtDate.toLocaleDateString();

        const totalAmount = overallSubtotal + gstAmount + parseFloat(serviceChargess         || 0);

        return {
            invoice,
            agent,
            passportCountsByCountry,
            passportInfoByCountry,
            agentServiceCharge,
            iscash: invoice.is_cash,
            gstAmount,
            overallSubtotal,
            totalAmount,
            formattedCreatedAt,
            serviceChargess
        };
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        throw error;
    }
}

function generateInvoiceHtml(data) {
    const { invoice, agent, passportInfoByCountry, agentServiceCharge ,passportCountsByCountry,totalAmount,formattedCreatedAt,gstAmount,serviceChargess} = data;
    
    const passportCountsByCountryEntries = Object.entries(passportCountsByCountry);
    
    const serviceCharges = [
        { label: '1', text: '', condition: !invoice.iscash },
        { label: '2', text: '', condition: !invoice.iscash },
        { label: '4', text: 'Service Charges', value:`${serviceChargess}` },
        { label: '3', text: 'GST CHARGE 18%',  condition: !invoice.iscash , },
       
        { label: '5', text: '', value: '' },
        { label: '6', text: '', value: '' },
    ];

    // Customize this function to generate the HTML content based on your template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <!-- Your external CSS links and font links -->
        <link rel="stylesheet" href="path/to/font-awesome/css/all.min.css">
        <link rel="stylesheet" href="./app.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <!-- Add more links to fonts as needed -->
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
  
   
        <style>
            @media print {
                @page {
                    size: 350mm 500mm;
                    margin: 15mm 15mm 15mm 15mm;
                }
    
                html {
                    /* background: #dce7fb; */
                    -webkit-print-color-adjust: exact;
                }
    
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
    
                .Communication_div {
                    width: 25%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Communication_data_div {
                    width: 75%;
                }
    
                .Courier_div {
                    width: 15%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Courier_data_div {
                    width: 85%;
                }
    
                .Other_div {
                    width: 15%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Other_data_div {
                    width: 85%;
                }
    
                .Rupees_div {
                    width: 8%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Rupees_data_div {
                    width: 92%;
                }
    
                .main-div-of-all {
                    width: 95%;
    
                    border: 1px solid black;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                }
    
                .main-logo-txt-div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                }
    
                .form-main-div {
                    padding: 2rem 0rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    width: 100%;
                }
    
                .main-header-div {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-direction: row;
                    /* border: 1px solid; */
                    /* border-bottom: none;  */
                }
    
                .main-body-div {
                    width: 100%;
                    /* display: flex;justify-content: space-between;align-items: center;flex-direction: row; */
                    /* border: 1px solid; */
                    /* border-bottom: none; */
                }
    
                .div-of-two-txt {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: column;
                }
    
                .main-div-of-details {
                    padding: 9px;
                }
    
                .main-hr-div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    /* flex-direction: c; */
                }
    
                .hr {
                    width: 100%;
                    border: 2px solid black;
                }
    
                .add-txt-main-div {
                    padding: 5px;
                    letter-spacing: 2 px;
                }
    
                .main-div-of-name {
                    width: 59.5%;
                    height: 60px;
                    display: flex;
                    padding: 10px;
                    align-items: flex-end;
                    justify-content: left;
                    flex-direction: row;
                    gap: 1rem;
                }
    
                .div-of-input-1 {
                    /* border: 1px solid black;
          border-left: none;
          border-top: none;
          border-right: none; */
                    border-bottom: 1px solid black;
                    width: 100%;
                    height: 15px;
                }
    
                .div-of-input-2 {
                    border-bottom: 1px solid black;
                    width: 100%;
                    height: 15px;
                }
    
                .main-div-of-input {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    /* align-items: center; */
                    /* justify-contfon: column; */
                }
    
                .txt-div {
                    text-align: center;
                }
    
                .main-div-of-name-bill-no {
                    display: flex;
                    justify-content: left;
                    align-items: center;
                    flex-direction: row;
                    width: 100%;
                    border-left: 0;
                    border-right: 0;
                }
    
                .main-div-of-bill-date {
                    padding: 13px;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: column;
                }
    
                .bill-no-main-div {
                    gap: 1rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                }
    
                .date-main-div {
                    gap: 33px;
                    display: flex;
                    justify-content: center;
                    /* align-items: center; */
                    flex-direction: row;
                }
    
                .khadi-line {
                    border: 1px solid black;
                    height: 76px;
                }
    
                .current-date {
                    border-bottom: 1px solid #000;
                    width: 150px;
                }
    
                .body-table-parent {
                    border: 2px solid black;
                    width: 100%;
                    height: max-content;
                    display: flex;
                    /* justify-content: center; */
                    /* align-items: center; */
                    flex-direction: row;
                }
    
                .body-table-right-parent> :nth-child(1)> :nth-child(1) {
                    width: 70%;
                    border-right: 1px solid black !important;
                    border-bottom: 2px solid black !important;
    
                    height: 50px;
                }
    
                .body-table-right-parent> :nth-child(1)> :nth-child(2) {
                    width: 30%;
                    border-left: 1px solid black !important;
                    border-bottom: 2px solid black !important;
                    height: 50px;
                }
    
                .body-table-right-parent> :nth-child(1) {
                    height: 50px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
    
                .body-table-right-parent> :nth-child(2) {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
    
                .body-table-right-parent> :nth-child(2)> :nth-child(1) {
                    width: 70%;
                    height: 100%;
                    border-right: 1px solid black !important;
                }
    
                .body-table-right-parent> :nth-child(2)> :nth-child(2) {
                    width: 30%;
                    border-left: 1px solid black !important;
                    height: 100%;
                }
    
                .body-table-right-parent> :nth-child(3) {
                    height: 50px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
    
                /* .body-table-right-parent > :nth-child(3) > :nth-child(1) {
            width: 70%;
            border-right: 1px solid black !important;
            border-top: 2px solid black !important;
            height: 50px;
          } */
                .body-table-right-parent> :nth-child(3)> :nth-child(1) {
                    width: 70%;
                    border-right: 1px solid black !important;
                    border-top: 2px solid black !important;
                    height: 50px;
                    padding: 1rem;
                    text-align: end;
                }
    
                .body-table-right-parent> :nth-child(3)> :nth-child(2) {
                    width: 30%;
                    border-left: 1px solid black !important;
                    border-top: 2px solid black !important;
                    height: 50px;
                }
    
                .body-table-left {
                    padding: 1rem 2rem;
                    width: 75%;
                    height: 100%;
                    border-right: 1px solid black;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-start;
                }
    
                .body-table-left-1 {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: 2rem;
                }
    
                .body-table-left-2 {
                    width: 100%;
                    height: auto;
                }
    
                .ek-down-ek {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 0.6rem;
                }
    
                .body-table-right {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                }
    
                .body-table-right-div-1 {
                    text-align: end;
                    width: 80%;
                    height: 100%;
                    border-right: 2px solid black;
                }
    
                .body-table-right-div-1>span {
                    padding-right: 1rem;
                    font-size: 24px;
                }
    
                .body-table-right-div-2 {
                    width: 20%;
                    height: 100%;
                }
    
                .body-table-right-div--head {
                    width: 100%;
                    height: 60px;
                    border-bottom: 2px solid black;
                }
    
                .body-table-right-parent {
                    display: flex;
                    width: 25%;
    
                    flex-direction: column;
                    justify-content: space-between;
                    /* gap: 10rem; */
                    /* border: 1px solid green;÷ */
                    align-items: center;
                }
    
                .body-left-passengers-div-head {
                    font-weight: 600;
                    width: 100%;
                    font-size: 18px;
                }
    
                .body-left-passengers-div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    width: 100%;
                    height: auto;
                    gap: 0.5rem;
                    /* padding: 2rem; */
                }
    
                .body-left-passengers-div-content-repeat {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    flex-direction: row;
                    gap: 0.5rem;
                }
    
                .bhai-yaha-data-ayega-gst-wala {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    /* gap: 16rem; */
                    width: 100%;
                    height: 24px;
                    border-bottom: 1px solid black;
                }
    
                .bhai-yaha-data-ayega-name-wala {
                    display: flex;
                    flex-direction: row;
                    /* gap: 16rem; */
                    width: 100%;
                    min-height: 24px;
                    height: auto;
                    border-bottom: 1px solid black;
                    position: relative;
                }
    
                .bhai-yaha-data-ayega-name-wala-1 {
                    width: 60%;
                    height: 15px;
                    /* border-bottom: 1px solid black; */
                }
    
                .bhai-yaha-data-ayega-name-wala-2 {
                    width: 20%;
                    height: 15px;
                    /* border-bottom: 1px solid black; */
                }
    
                .bhai-yaha-data-ayega-name-wala-3 {
                    width: 20%;
                    height: 15px;
                }
    
                .bhai-yaha-data-ayega-name-wala-passenger-1 {
                    width: 100%;
                    height: 15px;
                }
    
                .bhai-yaha-data-ayega-name-wala-passenger-2 {
                    width: 40%;
                    height: 15px;
                }
    
                .bhai-yaha-data-ayega-name-wala-price {
                    width: 90%;
                    height: 24px;
                    font-size: 20px;
                }
    
                .body-left-passengers-div-content-repeat>span>span {
                    font-size: 20px;
                    font-weight: 600;
                }
    
                .body-left-passengers-div-content {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 0.6rem;
                }
    
                .body-left-passengers-div-content-price {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-end;
                    flex-direction: column;
                    gap: 0.6rem;
                    text-align: end;
                }
    
                .body-table-right-bottom {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 120px;
                }
    
                .main-div-of-line {
                    display: flex;
                    /* justify-content: center;
        align-items: center; */
                    flex-direction: row;
                }
    
                .div-of-line-1 {
                    border-bottom: 1px solid #000;
                    width: 900px;
                }
    
                .div-of-line-2 {
                    border-bottom: 1px solid #000;
                    width: 805px;
                }
    
                .div-of-line-3 {
                    border-bottom: 1px solid #000;
                    width: 757px;
                }
    
                .div-of-line-4 {
                    border-bottom: 1px solid #000;
                    width: 800px;
                }
    
                .second-div-main {
                    display: flex;
                    flex-direction: row;
                }
    
                .second-heading {
                    width: 95px;
                    font-size: 13px;
                    font-weight: 900;
                }
    
                .first-heading {
                    /* width: 95px; */
                    font-size: 13px;
                    font-weight: 900;
                }
    
                .comm-txt {
                    font-size: 13px;
                    font-weight: 900;
                }
    
                .third-div-main {
                    display: flex;
                    flex-direction: row;
                }
    
                .main-div-of-communication {
                    display: flex;
                    flex-direction: row;
                }
    
                .body-left-visa-charges-parent-div {
                    /* border: 1px solid lime; */
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: row;
                    gap: 0.6rem;
                }
    
                .body-left-visa-charges-parent-div-price {
                    /* border: 1px solid lime; */
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 2rem;
                }
    
                .body-left-visa-charges-1 {
                    font-size: 18px;
                    font-weight: 600;
                    width: 25%;
                    height: auto;
                }
    
                .body-left-visa-charges-2 {
                    width: 75%;
                    height: auto;
                }
    
                .body-left-visa-content-repeat>span>span {
                    font-size: 20px;
                    font-weight: 600;
                }
    
                .body-left-visa-content-repeat {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 0.6rem;
                }
    
                .body-left-rightDash-parent-div {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: row;
                    gap: 0.6rem;
                }
    
                .Grand-Total-txt-div {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    font-size: 24px;
                    font-weight: 600;
                }
    
                .terms-condition-main-div {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 95%;
                }
    
                .div-of-left-side {
                    padding-top: 8px;
                    width: 80%;
                    display: flex;
                    gap: 1rem;
                    justify-content: left;
                    align-items: flex-start;
                    flex-direction: column;
                }
    
                .terms-of-payment-txt {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }
    
                .terms-of-payment-txt-detail {
                    width: 60%;
                }
    
                .div-of-right-side {
                    /* border: 1px solid lime; */
                    padding-top: 8px;
                    width: 20%;
                    display: flex;
                    gap: 1rem;
                    /* justify-content: left; */
                    /* align-items: flex-start; */
                    flex-direction: column;
                }
    
                .first-txt {
                    text-align: end;
                }
    
                .scnd-txt {
                    width: 90%;
                    text-align: center;
                }
    
                .third-txt {
                    text-align: end;
                }
    
                .frst-data {
                    display: flex;
                    position: absolute;
                    top: 20%;
                    right: 10px;
                    flex-direction: column;
                    gap: 14px;
                }
    
                .scnd-data {
                    display: flex;
                    position: absolute;
                    top: 50.54%;
                    right: 10px;
                    flex-direction: column;
                    gap: 14px;
                }
    
                .frst-scnd-data {
                    position: relative;
                }
    
                .img-div {
                    width: 100px;
                    height: 70px;
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                    /* background-color: blue; */
                }
    
                .img-div>img {
                    width: 70%;
                    aspect-ratio: 3/2;
                    object-fit: cover;
                }
    
                .main-logo-txt-div {
                    padding-top: 10px;
                    padding-left: 10px;
                }
    
                .name_title_text {
                    height: 100%;
                }
    
                .name_teg {
                    padding-bottom: 5px;
                    font-size: 15px;
                }
    
                .position-right-me-lene-ka-hai {
                    position: absolute;
                    right: -300px;
                }
    
                .position-right-me-lene-ka-hai-part-2 {
                    position: absolute;
                    right: -205px;
                }
            }
    
            /* ===================================Normal Css=============================================== */
    
            @media screen {
                .name_title_text {
                    height: 100%;
                }
    
                .img-div {
                    width: 150px;
                    height: 105px;
                    overflow: hidden;
                    /* background-color: blue; */
                }
    
                .img-div>img {
                    width: 100%;
                    aspect-ratio: 3/2;
                    object-fit: cover;
                }
    
                @page {
                    size: 350mm 500mm;
                    margin: 15mm 15mm 15mm 15mm;
                }
    
                html {
                    /* background: #dce7fb; */
                    -webkit-print-color-adjust: exact;
                }
    
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
    
                .Communication_div {
                    width: 15%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Communication_data_div {
                    width: 85%;
                }
    
                .Courier_div {
                    width: 10%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Courier_data_div {
                    width: 90%;
                }
    
                .Other_div {
                    width: 9%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Other_data_div {
                    width: 91%;
                }
    
                .Rupees_div {
                    width: 4%;
                    font-size: 17px;
                    font-weight: 600;
                }
    
                .Rupees_data_div {
                    width: 96%;
                }
    
                .main-div-of-all {
                    width: 95%;
                    /* padding: 20px; */
                    border: 1px solid black;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                }
    
                .main-logo-txt-div {
                    padding-top: 10px;
                    padding-left: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                }
    
                .form-main-div {
                    padding: 1rem 0rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    width: 100%;
                }
    
                .main-header-div {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-direction: row;
                    /* border: 1px solid; */
                    /* border-bottom: none;  */
                }
    
                .main-body-div {
                    width: 100%;
                    /* display: flex;justify-content: space-between;align-items: center;flex-direction: row; */
                    /* border: 1px solid; */
                    /* border-bottom: none; */
                }
    
                .div-of-two-txt {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: column;
                }
    
                .main-div-of-details {
                    padding: 9px;
                }
    
                .main-hr-div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    /* flex-direction: c; */
                }
    
                .hr {
                    width: 100%;
                    border: 2px solid black;
                }
    
                .add-txt-main-div {
                    padding: 5px;
                    letter-spacing: 2 px;
                }
    
                .main-div-of-name {
                    width: 59.5%;
                    height: 60px;
    
                    display: flex;
                    padding: 10px;
                    align-items: flex-end;
                    justify-content: left;
                    flex-direction: row;
                    gap: 1rem;
                }
    
                .div-of-input-1 {
                    /* border: 1px solid black;
          border-left: none;
          border-top: none;
          border-right: none; */
                    border-bottom: 1px solid black;
                    width: 100%;
                    height: 20px;
                    padding-bottom: 5px;
                }
    
                .name_teg {
                    padding-bottom: 5px;
                    font-size: 15px;
                }
    
                .div-of-input-2 {
                    border-bottom: 1px solid black;
                    width: 100%;
                    height: 15px;
                }
    
                .main-div-of-input {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    /* align-items: center; */
                    /* justify-contfon: column; */
                }
    
                .txt-div {
                    text-align: center;
                }
    
                .main-div-of-name-bill-no {
                    display: flex;
                    justify-content: left;
                    align-items: center;
                    flex-direction: row;
                    width: 100%;
                    border-left: 0;
                    border-right: 0;
                }
    
                .main-div-of-bill-date {
                    padding: 13px;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: column;
                }
    
                .bill-no-main-div {
                    gap: 1rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                }
    
                .date-main-div {
                    gap: 33px;
                    display: flex;
                    justify-content: center;
                    /* align-items: center; */
                    flex-direction: row;
                }
    
                .khadi-line {
                    border: 1px solid black;
                    height: 76px;
                }
    
                .current-date {
                    border-bottom: 1px solid #000;
                    width: 150px;
                }
    
                .body-table-parent {
                    border: 2px solid black;
                    width: 100%;
                    height: 100vh;
                    height: 100%;
                    display: flex;
         
                    flex-direction: row;
                }
    
                .body-table-right-parent> :nth-child(1)> :nth-child(1) {
                    width: 70%;
                    border-right: 1px solid black !important;
                    border-bottom: 2px solid black !important;
    
                    height: 50px;
                }
    
                .body-table-right-parent> :nth-child(1)> :nth-child(2) {
                    width: 30%;
                    border-left: 1px solid black !important;
                    border-bottom: 2px solid black !important;
                    height: 50px;
                }
    
                .body-table-right-parent> :nth-child(1) {
                    height: 50px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
    
                .body-table-right-parent> :nth-child(2) {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
    
                .body-table-right-parent> :nth-child(2)> :nth-child(1) {
                    width: 70%;
                    height: 100%;
                    border-right: 1px solid black !important;
                }
    
                .body-table-right-parent> :nth-child(2)> :nth-child(2) {
                    width: 30%;
                    border-left: 1px solid black !important;
                    height: 100%;
                }
    
                .body-table-right-parent> :nth-child(3) {
                    height: 50px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
    
                .body-table-right-parent> :nth-child(3)> :nth-child(1) {
                    width: 70%;
                    border-right: 1px solid black !important;
                    border-top: 2px solid black !important;
                    height: 50px;
                    padding: 1rem;
                    text-align: end;
                }
    
                .body-table-right-parent> :nth-child(3)> :nth-child(2) {
                    width: 30%;
                    border-left: 1px solid black !important;
                    border-top: 2px solid black !important;
                    height: 50px;
                }
    
                .body-table-left {
                    padding: 1rem 2rem;
                    width: 75%;
                    height: 100%;
                    border-right: 1px solid black;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-start;
                }
    
                .body-table-left-1 {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: 2rem;
                }
    
                .body-table-left-2 {
                    width: 100%;
                    height: auto;
                }
    
                .ek-down-ek {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 0.6rem;
                }
    
                .body-table-right {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                }
    
                .body-table-right-div-1 {
                    text-align: end;
                    width: 80%;
                    height: 100%;
                    border-right: 2px solid black;
                }
    
                .body-table-right-div-1>span {
                    padding-right: 1rem;
                    font-size: 24px;
                }
    
                .body-table-right-div-2 {
                    width: 20%;
                    height: 100%;
                }
    
                .body-table-right-div--head {
                    width: 100%;
                    height: 60px;
                    border-bottom: 2px solid black;
                }
    
                .body-table-right-parent {
                    display: flex;
                    width: 25%;
                    min-height: 100vh;
                    flex-direction: column;
                    justify-content: space-between;
                    /* gap: 10rem; */
                    border: 1px solid green;
                    align-items: center;
                }
    
                .body-left-passengers-div-head {
                    font-weight: 600;
                    width: 100%;
                    font-size: 18px;
                }
    
                .body-left-passengers-div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    width: 100%;
                    height: auto;
                    gap: 0.5rem;
                    /* padding: 2rem; */
                }
    
                .body-left-passengers-div-content-repeat {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    flex-direction: row;
                    gap: 0.5rem;
                }
    
                .bhai-yaha-data-ayega-name-wala {
                    display: flex;
                    flex-direction: row;
                    /* gap: 16rem; */
                    width: 100%;
                    height: 24px;
                    border-bottom: 1px solid black;
                }
    
                .bhai-yaha-data-ayega-gst-wala {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    /* gap: 16rem; */
                    width: 100%;
                    height: 24px;
                    border-bottom: 1px solid black;
                }
    
                .bhai-yaha-data-ayega-name-wala-1 {
                    width: 60%;
                    height: 15px;
                    /* border-bottom: 1px solid black; */
                }
    
                .bhai-yaha-data-ayega-name-wala-2 {
                    width: 20%;
                    height: 15px;
                    /* border-bottom: 1px solid black; */
                }
    
                .bhai-yaha-data-ayega-name-wala-3 {
                    width: 20%;
                    height: 15px;
                    /* border-bottom: 1px solid black; */
                }
    
                .bhai-yaha-data-ayega-name-wala-passenger-1 {
                    width: 60%;
                    height: 15px;
                }
    
                .bhai-yaha-data-ayega-name-wala-passenger-2 {
                    width: 40%;
                    height: 15px;
                }
    
                .bhai-yaha-data-ayega-name-wala-price {
                    width: 90%;
                    height: 24px;
                    font-size: 20px;
                }
    
                .body-left-passengers-div-content-repeat>span>span {
                    font-size: 20px;
                    font-weight: 600;
                }
    
                .body-left-passengers-div-content {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 0.6rem;
                }
    
                .body-left-passengers-div-content-price {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-end;
                    flex-direction: column;
                    gap: 0.6rem;
                    text-align: end;
                }
    
                .body-table-right-bottom {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 120px;
                }
    
                .main-div-of-line {
                    display: flex;
                    /* justify-content: center;
        align-items: center; */
                    flex-direction: row;
                }
    
                .div-of-line-1 {
                    border-bottom: 1px solid #000;
                    width: 900px;
                }
    
                .div-of-line-2 {
                    border-bottom: 1px solid #000;
                    width: 805px;
                }
    
                .div-of-line-3 {
                    border-bottom: 1px solid #000;
                    width: 757px;
                }
    
                .div-of-line-4 {
                    border-bottom: 1px solid #000;
                    width: 800px;
                }
    
                .second-div-main {
                    display: flex;
                    flex-direction: row;
                }
    
                .second-heading {
                    width: 95px;
                    font-size: 13px;
                    font-weight: 900;
                }
    
                .first-heading {
                    /* width: 95px; */
                    font-size: 13px;
                    font-weight: 900;
                }
    
                .comm-txt {
                    font-size: 13px;
                    font-weight: 900;
                }
    
                .third-div-main {
                    display: flex;
                    flex-direction: row;
                }
    
                .main-div-of-communication {
                    display: flex;
                    flex-direction: row;
                }
    
                .body-left-visa-charges-parent-div {
                    /* border: 1px solid lime; */
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: row;
                    gap: 0.6rem;
                }
    
                .body-left-visa-charges-parent-div-price {
                    /* border: 1px solid lime; */
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 2rem;
                }
    
                .body-left-visa-charges-1 {
                    font-size: 18px;
                    font-weight: 600;
                    width: 25%;
                    height: auto;
                }
    
                .body-left-visa-charges-2 {
                    width: 75%;
                    height: auto;
                }
    
                .body-left-visa-content-repeat>span>span {
                    font-size: 20px;
                    font-weight: 600;
                }
    
                .body-left-visa-content-repeat {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    gap: 0.6rem;
                }
    
                .body-left-rightDash-parent-div {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: row;
                    gap: 0.6rem;
                }
    
                .Grand-Total-txt-div {
                    width: 100%;
                    height: auto;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    font-size: 24px;
                    font-weight: 600;
                }
    
                .terms-condition-main-div {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    width: 95%;
                }
    
                .div-of-left-side {
                    padding-top: 8px;
                    width: 80%;
                    display: flex;
                    gap: 1rem;
                    justify-content: left;
                    align-items: flex-start;
                    flex-direction: column;
                }
    
                .terms-of-payment-txt {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }
    
                .terms-of-payment-txt-detail {
                    width: 60%;
                }
    
                .div-of-right-side {
                    /* border: 1px solid lime; */
                    padding-top: 8px;
                    width: 20%;
                    display: flex;
                    gap: 1rem;
                    /* justify-content: left; */
                    /* align-items: flex-start; */
                    flex-direction: column;
                }
    
                .first-txt {
                    text-align: end;
                }
    
                .scnd-txt {
                    width: 90%;
                    text-align: center;
                }
    
                .third-txt {
                    text-align: end;
                }
    
                .frst-data {
                    display: flex;
                    position: absolute;
                    top: 20%;
                    right: 10px;
                    flex-direction: column;
                    gap: 14px;
                }
    
                .scnd-data {
                    display: flex;
                    position: absolute;
                    top: 50.5%;
                    right: 10px;
                    flex-direction: column;
                    gap: 14px;
                }
    
                .frst-scnd-data {
                    position: relative;
                }
    
                .position-right-me-lene-ka-hai {
                    position: absolute;
                    right: -100px;
                }
    
                .position-right-me-lene-ka-hai-part-2 {
                    position: absolute;
                    right: -204px;
                }
            }
    
        </style>
    
    
 </head>
  <body>
  <div class="form-main-div">
  <div class="main-div-of-all">
      <div class="main-header-div">
          <div class="main-logo-txt-div">
              <div class="img-div">
                  <img src="/assets/images/sidebarlogo2.png" alt="" />
              </div>
              <div class="div-of-two-txt">
                  <div class="logo-txt-1">Talab</div>
                  <div class="logo-txt-1">tours and travels pvt.ltd.</div>
              </div>
          </div>
          <div class="main-div-of-details">
              <div class="div-of-mobile">Mo. :+91942944126</div>
              <div class="div-of-offc-no">Off. No :+91-79-26564878</div>
              <div class="div-of-email">
                  E-mail : talabtoursandtravels@gmail.com
              </div>
          </div>
      </div>
      <div class="main-body-div">
          <div class="main-hr-div">
              <div class="hr"></div>
          </div>
          <div class="add-txt-main-div">
              <div class="txt-div">
                  33, UPPER GROUND FLOOR, CITY CENTER, NR. SWASTIK CHAR RASTA,
                  NAVRANGPURA, AHMEDABAD - 380009.
              </div>
          </div>
          <div class="main-hr-div">
              <div class="hr"></div>
          </div>
          <div class="main-div-of-name-bill-no">
              <div class="main-div-of-name">
                  <div class="name_title_text">
                      <span class="prmnt-name-div"> M/s. </span>
                  </div>
                  <div class="main-div-of-input">
                      <div class="div-of-input-1">
                          <span class="name_teg">${agent.firstname}   (GST-${agent.gst})</span>
                      </div>
                      <div class="div-of-input-2"></div>
                  </div>
              </div>
              <div class="khadi-line"></div>
              <div class="main-div-of-bill-date">
                  <div class="bill-no-main-div">
                      <div class="bill-no-txt-1">Bill No</div>
                      <div class="bill-no-txt-2">:</div>
                      <div class="bill-number">${invoice.id}</div>
                  </div>
                  <div class="date-main-div">
                      <div class="date-txt-1">Date</div>
                      <div class="date-txt-2">:</div>
                      <div class="current-date">${formattedCreatedAt}</div>
                  </div>
              </div>
          </div>
      </div>
      <div class="body-table-parent">
          <div class="body-table-left">
              <div class="body-table-left-1">
                  <div class="body-left-passengers-div">
                      <div class="body-left-passengers-div-head">
                          <span>Name of passenger's</span>
                      </div>
                      ${Object.entries(passportInfoByCountry).map(([country, passportInfos], countryIndex) => `
                      ${passportInfos.map((passportInfo, index) => `
                          <div class="body-left-passengers-div-content-repeat">
                              <span>
                                  <span>${index + 1}</span>
                              </span>
                              <div class="bhai-yaha-data-ayega-name-wala">
                                  <div class="bhai-yaha-data-ayega-name-wala-passenger-1">
                                      ${passportInfo.passengername}
                                  </div>
                                  <div class="bhai-yaha-data-ayega-name-wala-passportnumber">
                                      ${passportInfo.passportnumber}
                                  </div>
                              </div>
                          </div>
                      `).join('')}
                  `).join('')}
                  <div class="body-left-passengers-div-content-repeat">
                  ${passportCountsByCountryEntries.map(([country, count]) => `
                      <div class="bhai-yaha-data-ayega-name-wala">
                          ${country}: ${count}
                      </div>
                  `).join('')}
              </div>
              <!-- othe
                  
                  <!-- Display visa charges -->
                  <div class="body-left-visa-charges-parent-div">
                      <div class="body-left-visa-charges-1">
                          <span>Visa Charges</span>
                      </div>
                      <div class="body-left-passengers-div-content" id="body-left-visa-div-content-id">
                          ${agentServiceCharge.map((entry, index) => `
                              <div class="body-left-passengers-div-content-repeat">
                                  <span>
                                      <span>${index + 1}</span>
                                  </span>
                                  <div class="bhai-yaha-data-ayega-name-wala">
                                      <div class="bhai-yaha-data-ayega-name-wala-1">
                                          ${entry.country}
                                      </div>
                                      <div class="bhai-yaha-data-ayega-name-wala-2">${entry.price}</div>
                                      <div class="bhai-yaha-data-ayega-name-wala-3">${entry.totalCount}</div>
                                      <div class="bhai-yaha-data-ayega-name-wala-3 position-right-me-lene-ka-hai">
                                          ${entry.totalAmount}
                                      </div>
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                  </div>
                  
  
  
                  <div class="body-left-visa-charges-parent-div">
                  <div class="body-left-visa-charges-1">
                      <span>Service Charges</span>
                  </div>
                  <div class="body-left-passengers-div-content" id="body-left-visa-charges-parent-div" style="position: relative;">
                      ${serviceCharges.map((charge) => `
                          <div class="body-left-passengers-div-content-repeat">
                              <span>
                                  <span>${charge.label}</span>
                              </span>
                              <div class="bhai-yaha-data-ayega-gst-wala"  >
                                  ${charge.text}
                                  ${charge.condition && charge.label === '3' ?  `
                                      <div class="position-right-me-lene-ka-hai-part-2">
                                          <div>${gstAmount}</div>
                                      </div>
                                  ` : ''}
                              </div>
                              ${charge.value !== undefined ? `
                                  <div class="position-right-me-lene-ka-hai-part-2">
                                      <div>${charge.value}</div>
                                  </div>
                              ` : ''}
                          </div>
                      `).join('')}
                  </div>
              </div>
              </div>
              <div class="body-left-rightDash-parent-div">
  
                  <span class="Courier_div">Courier Charges</span>
                  <div class="Courier_data_div">
                      <div class="bhai-yaha-data-ayega-name-wala"></div>
                  </div>
              </div>
              <div class="body-left-rightDash-parent-div">
  
                  <span class="Other_div">Other Charges</span>
                  <div class="Other_data_div">
                      <div class="bhai-yaha-data-ayega-name-wala"></div>
                  </div>
              </div>
              <div class="body-left-rightDash-parent-div">
  
                  <span class="Rupees_div">Rupees</span>
                  <div class="Rupees_data_div">
                      <div class="bhai-yaha-data-ayega-name-wala"></div>
                  </div>
              </div>
          </div>
          <div class="body-table-left-2">
              <div class="Grand-Total-txt-div">
                  <span> Grand Total </span>
              </div>
          </div>
      </div>
      <div class="body-table-right-parent">
          <div>
              <div></div>
              <div></div>
          </div>
          <div>
              <div class="frst-scnd-data">
                  <div class="frst-data">
                  </div>
                  <div class="scnd-data">
               
                  </div>
              </div>
  
              <div></div>
          </div>
          <div>
              <div>${totalAmount}</div>
              <div></div>
          </div>
           </div>
  </div>
  </div>
  <div class="terms-condition-main-div">
  <div class="div-of-left-side">
      <div class="terms-of-payment-txt">
          <h2>TERMS OF PAYMENT</h2>
      </div>
      <div class="terms-of-payment-txt-detail">
          <p>
              Cash payments should be made directly to the cashier in our office
              Company's printed official receipt duly signed by the cashler must
              always be obtained against Payment made in cash or; [p-o., 1I98
              Cheque as If will be considered as the only valid document to such
              payment Cheque or Demand Draft should be down In favour of Talab
              Tours And Travels Private Limited Only '
          </p>
      </div>
  </div>
  <div class="div-of-right-side">
      <div class="first-txt">
          <h2>E.& O.E.</h2>
      </div>
      <div class="scnd-txt">
          <h3>For.Tours And Travels Private Limited</h3>
      </div>
      <div class="third-txt">
          <h2>Proprietor</h2>
      </div>
         <div class="hstack gap-2 justify-content-end d-print-none mt-4">
                                  <a href="javascript:window.print()" class="btn btn-success"><i class="ri-printer-line align-bottom me-1"></i> Print</a>
                                  <a href="javascript:void(0);" class="btn btn-primary"><i class="ri-download-2-line align-bottom me-1"></i> Download</a>
                                      <a href="javascript:void(0);" class="btn btn-primary" id="sendEmailButton"><i class="ri-download-2-line align-bottom me-1"></i> Send Email</a>
  
                              </div>
  
  </div>
  </div>
  </body>
  
  </html>`;

    return htmlContent;
}
// Function to convert HTML to PDF using html-pdf
function convertHtmlToPdf(htmlContent) {
    return new Promise((resolve, reject) => {
        const wkhtmltopdf = spawn('wkhtmltopdf', ['-', '-']); // Use '-' for stdin and stdout

        let pdfBuffer = Buffer.from([]);
        wkhtmltopdf.stdout.on('data', (data) => {
            pdfBuffer = Buffer.concat([pdfBuffer, data]);
        });

        wkhtmltopdf.on('close', (code) => {
            if (code === 0) {
                resolve(pdfBuffer);
            } else {
                reject(new Error(`wkhtmltopdf process exited with code ${code}`));
            }
        });

        wkhtmltopdf.stdin.write(htmlContent, 'utf8');
        wkhtmltopdf.stdin.end();
    });
}

  module.exports = router;
