const express = require('express');
const emailRouter = express.Router();

const sendEmail = require('../services/emailService');
const {sendEmails} = require('../controller/email.js')

// Route to send emails
emailRouter.post('/sendMany', async (req, res) => {
  try {
    const result = await sendEmails(req.body.recipients); // Pass recipients from the request body

    if (result.success) {
      return res.status(200).json({ message: 'All emails sent successfully!' });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error in /sendMany:', error);
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
});

emailRouter.post('/send', async (req, res) =>{
  const {to, subject, body} = req.body
  try{
    if(!to || !subject || !body){
      return res.json({message:'missing field'})
    }
    const result = await sendEmail({to, subject, body})
    console.log('sent')
    res.status(200).json({message:'email sent successfully'})
  }catch(error){
    console.log(error)
  }
})

// emailRouter.post('/schedule-email', async (req, res) => {
//   try{
    
//   }catch(error){
    
//   }
// })

module.exports = emailRouter