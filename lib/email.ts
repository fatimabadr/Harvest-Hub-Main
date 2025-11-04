import nodemailer from 'nodemailer';
import { query } from '@/lib/db';

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USERNAME,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

type EmailTemplate = {
  subject: string;
  html: string;
};

export type SubscriptionEmailType = 
  | 'confirmation'
  | 'delivery_reminder'
  | 'delivery_confirmation'
  | 'renewal_reminder'
  | 'payment_failed';

interface SubscriptionItem {
  name: string;
  quantity: number;
  unitText: string;
  originalPrice: string;
  finalPrice: string;
  savings: string;
}

const getEmailTemplate = (type: SubscriptionEmailType, data: any): EmailTemplate => {
  switch (type) {
    case 'confirmation':
      return {
        subject: 'Your HarvestHub Subscription Confirmation',
        html: `
          <h1>Welcome to HarvestHub!</h1>
          <p>Thank you for subscribing to our ${data.subscriptionType} plan.</p>
          
          <h2>Subscription Details</h2>
          <div style="margin-bottom: 20px;">
            <p><strong>Plan Type:</strong> ${data.subscriptionType}</p>
            <p><strong>Base Plan Price:</strong> £${data.planPrice} per ${data.subscriptionType === 'monthly' ? 'month' : data.subscriptionType === 'biweekly' ? '2 weeks' : 'week'}</p>
          </div>

          <h2>Your ${data.packageType === 'custom' ? 'Selected Items' : 'Package Contents'}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Quantity</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Original Price</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Your Price</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Savings</th>
              </tr>
            </thead>
            <tbody>
              ${(data.items as SubscriptionItem[]).map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${item.quantity} ${item.unitText}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">£${item.originalPrice}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">£${item.finalPrice}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">£${item.savings}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">Price Summary</h3>
            <p><strong>Original Total:</strong> £${data.originalTotal}</p>
            <p><strong>Your Total:</strong> £${data.finalTotal}</p>
            <p><strong>Total Savings:</strong> £${data.totalSavings}</p>
          </div>

          <h2>Delivery Schedule</h2>
          <ul style="list-style-type: none; padding: 0;">
            ${data.deliveryDates.map((date: string, index: number) => `
              <li style="margin-bottom: 8px;">
                <strong>Delivery ${index + 1}:</strong> ${new Date(date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </li>
            `).join('')}
          </ul>

          <div style="margin-top: 20px;">
            <h2>Delivery Address</h2>
            <p>${data.deliveryAddress}<br>${data.city}<br>${data.postcode}</p>
          </div>
        `
      };

    case 'delivery_reminder':
      return {
        subject: 'Your HarvestHub Delivery is Coming Soon!',
        html: `
          <h1>Your delivery is coming soon!</h1>
          <p>Your next delivery is scheduled for ${data.deliveryDate}.</p>
          <p>Delivery address:</p>
          <p>${data.deliveryAddress}<br>${data.city}<br>${data.postcode}</p>
          <h2>Items in your delivery:</h2>
          <ul>
            ${data.items.map((item: any) => `<li>${item.quantity}x ${item.name}</li>`).join('')}
          </ul>
        `
      };

    case 'delivery_confirmation':
      return {
        subject: 'Your HarvestHub Delivery is Complete',
        html: `
          <h1>Your delivery has been completed!</h1>
          <p>We hope you enjoy your fresh produce.</p>
          <p>How was your delivery? <a href="${data.feedbackLink}">Leave feedback</a></p>
          <p>Next delivery scheduled for: ${data.nextDeliveryDate}</p>
        `
      };

    case 'renewal_reminder':
      return {
        subject: 'Your HarvestHub Subscription Renewal',
        html: `
          <h1>Subscription Renewal Reminder</h1>
          <p>Your next payment of £${data.amount} will be processed on ${data.billingDate}.</p>
          <p>To view or modify your subscription, <a href="${data.subscriptionLink}">click here</a>.</p>
        `
      };

    case 'payment_failed':
      return {
        subject: 'Action Required: HarvestHub Payment Failed',
        html: `
          <h1>Payment Failed</h1>
          <p>We were unable to process your payment of £${data.amount}.</p>
          <p>Please <a href="${data.updatePaymentLink}">update your payment information</a> to continue your subscription.</p>
        `
      };
  }
};

export const sendSubscriptionEmail = async (
  to: string,
  type: SubscriptionEmailType,
  data: any
) => {
  try {
    const template = getEmailTemplate(type, data);
    
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
    });

    
    await query(`
      INSERT INTO subscription_emails (
        subscription_id,
        email_type,
        template_data
      ) VALUES ($1, $2, $3)
    `, [data.subscriptionId, type, JSON.stringify(data)]);

    return true;
  } catch (error) {
    console.error('Error sending subscription email:', error);
    throw error;
  }
}; 