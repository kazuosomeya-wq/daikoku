const data = {
    service_id: 'service_0bc50bn',
    template_id: 'template_tomw358',
    user_id: 'KEPUemG6ObA-0ZwJf',
    template_params: {
        to_name: 'Admin',
        from_name: 'Antigravity',
        message_body: 'This is a test email sent bypassing the browser restriction.'
    }
};

fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://www.daikokuhunter.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify(data)
}).then(async res => {
    console.log('Status: ', res.status);
    console.log('Response:', await res.text());
}).catch(console.error);
