window.onload = function finishOAuth() {
    const handler = Plaid.create({
        receivedRedirectUri: window.location.href,
        onSuccess: function (public_token, metadata) {
            // Send the public token to the server for exchange
            fetch('/api/exchange_public_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_token }),
            }).then(() => {
                window.location.href = '/index.html'; // Redirect to the main app
            });
        },
        onExit: function (err) {
            console.error('Error finishing OAuth flow:', err);
        },
    });

    handler.open();
};

