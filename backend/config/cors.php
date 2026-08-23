<?php

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // Lets the browser cache the CORS preflight response instead of repeating
    // it before every single authenticated request. Browsers cap this
    // themselves (Chrome ~2h, Firefox 24h) regardless of the value sent.
    'max_age' => 86400,

    'supports_credentials' => false,
];
