// SMS Notification Service
class SMSService {
    constructor() {
        this.adminPhoneNumber = "+1234567890"; // Replace with your actual number
        this.apiKey = "your_sms_api_key"; // Replace with your SMS provider API key
    }

    async sendSMSNotification(order) {
        try {
            const message = this.formatOrderMessage(order);

            // Choose your SMS provider and uncomment the appropriate method
            // await this.sendViaTwilio(message);
            // await this.sendViaAWS(message);
            await this.sendViaGenericAPI(message);

            console.log('SMS notification sent successfully');
            return true;
        } catch (error) {
            console.error('Failed to send SMS:', error);
            // Fallback: Log to console or send email
            this.fallbackNotification(order);
            return false;
        }
    }

    formatOrderMessage(order) {
        let message = `🛍️ New Order #${order.id}\n\n`;
        message += `Customer: ${order.shipping_address.first_name} ${order.shipping_address.last_name}\n`;
        message += `Total: $${parseFloat(order.total_amount).toFixed(2)}\n\n`;
        message += `Items:\n`;

        order.items.forEach(item => {
            message += `• ${item.name} x ${item.quantity} - $${(parseFloat(item.price) * item.quantity).toFixed(2)}\n`;
        });

        message += `\nShipping Address:\n`;
        message += `${order.shipping_address.address}, ${order.shipping_address.city}\n`;
        message += `${order.shipping_address.state} ${order.shipping_address.zip_code}, ${order.shipping_address.country}\n\n`;
        message += `Order placed: ${new Date(order.created_at).toLocaleString()}`;

        return message;
    }

    async sendViaTwilio(message) {
        // Twilio integration
        const accountSid = 'your_twilio_account_sid';
        const authToken = 'your_twilio_auth_token';

        const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'To': this.adminPhoneNumber,
                'From': 'your_twilio_phone_number',
                'Body': message
            })
        });

        if (!response.ok) {
            throw new Error('Twilio API error: ' + response.status);
        }
    }

    async sendViaAWS(message) {
        // AWS SNS integration
        const response = await fetch('https://sns.us-east-1.amazonaws.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-amz-json-1.0',
                'X-Amz-Target': 'AmazonSNS.Publish'
            },
            body: JSON.stringify({
                PhoneNumber: this.adminPhoneNumber,
                Message: message
            })
        });

        if (!response.ok) {
            throw new Error('AWS SNS error: ' + response.status);
        }
    }

    async sendViaGenericAPI(message) {
        // Generic SMS API (replace with your provider)
        const response = await fetch('https://api.smsprovider.com/v1/send', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: this.adminPhoneNumber,
                message: message,
                from: 'Tulay.inc'
            })
        });

        if (!response.ok) {
            throw new Error('SMS API error: ' + response.status);
        }
    }

    fallbackNotification(order) {
        // Fallback: Log to console and show browser notification
        console.log('SMS Fallback - Order Details:', order);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order Received', {
                body: `Order #${order.id} - $${parseFloat(order.total_amount).toFixed(2)}`,
                icon: '/favicon.ico'
            });
        }

        // You could also send an email fallback here
        this.sendEmailFallback(order);
    }

    async sendEmailFallback(order) {
        // Simple email fallback using a service like EmailJS or your backend
        try {
            const response = await fetch('/api/notifications/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: 'admin@tulay.inc',
                    subject: `New Order #${order.id}`,
                    message: this.formatOrderMessage(order)
                })
            });

            if (response.ok) {
                console.log('Email fallback sent successfully');
            }
        } catch (error) {
            console.error('Email fallback failed:', error);
        }
    }
}

// Global function to send SMS
async function sendSMSNotification(order) {
    const smsService = new SMSService();
    return await smsService.sendSMSNotification(order);
}

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', function() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});