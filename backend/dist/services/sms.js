"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpSms = sendOtpSms;
const https_1 = __importDefault(require("https"));
const isProd = process.env.NODE_ENV === 'production';
function postJson(url, payload, headers = {}) {
    return new Promise((resolve) => {
        try {
            const parsed = new URL(url);
            const data = JSON.stringify(payload);
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
                path: parsed.pathname + (parsed.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    ...headers,
                },
            };
            const req = https_1.default.request(options, (res) => {
                res.on('data', () => { });
                res.on('end', () => resolve({ success: res.statusCode ? res.statusCode < 300 : false }));
            });
            req.on('error', (err) => resolve({ success: false, error: err.message }));
            req.write(data);
            req.end();
        }
        catch (e) {
            resolve({ success: false, error: e.message });
        }
    });
}
function postForm(url, form, basicAuth) {
    return new Promise((resolve) => {
        try {
            const parsed = new URL(url);
            const data = new URLSearchParams(form).toString();
            const authHeader = basicAuth ? 'Basic ' + Buffer.from(`${basicAuth.user}:${basicAuth.pass}`).toString('base64') : undefined;
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
                path: parsed.pathname + (parsed.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data),
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
            };
            const req = https_1.default.request(options, (res) => {
                res.on('data', () => { });
                res.on('end', () => resolve({ success: res.statusCode ? res.statusCode < 300 : false }));
            });
            req.on('error', (err) => resolve({ success: false, error: err.message }));
            req.write(data);
            req.end();
        }
        catch (e) {
            resolve({ success: false, error: e.message });
        }
    });
}
async function sendOtpSms(phone, code) {
    const message = `Your JewelTrack OTP is ${code}. Valid for 5 minutes.`;
    // Webhook integration (generic gateway)
    const webhookUrl = process.env.SMS_WEBHOOK_URL;
    const webhookToken = process.env.SMS_WEBHOOK_TOKEN;
    if (webhookUrl) {
        const res = await postJson(webhookUrl, { to: phone, message }, webhookToken ? { 'X-Webhook-Token': webhookToken } : {});
        return res;
    }
    // Twilio integration
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM;
    if (twilioSid && twilioToken && twilioFrom) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const res = await postForm(twilioUrl, { From: twilioFrom, To: phone, Body: message }, { user: twilioSid, pass: twilioToken });
        return res;
    }
    // Development fallback: log to console
    if (!isProd) {
        console.log(`[DEV OTP] ${phone} -> ${message}`);
        return { success: true };
    }
    return { success: false, error: 'No SMS provider configured' };
}
